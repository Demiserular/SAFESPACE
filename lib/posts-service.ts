import { supabase } from './supabase';
import type {
  Post,
  Comment,
  Reaction,
  Report,
  CreatePostData,
  CreateCommentData,
  CreateReactionData,
  CreateReportData,
  PostWithDetails,
  CommentWithDetails,
  UserRole
} from './types';

export class PostsService {
  // Posts CRUD Operations
  static async createPost(data: CreatePostData): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const postData = {
      ...data,
      author_id: user?.id,
      is_anonymous: data.is_anonymous ?? true,
    };

    const { data: post, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;
    return post;
  }

  static async getPosts(category?: string, limit = 20, offset = 0): Promise<Post[]> {
    try {
      console.log("PostsService.getPosts called with:", { category, limit, offset })
      
      // Start with a simple query to test connectivity
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      console.log("Executing Supabase query...")
      const { data: posts, error } = await query;

      console.log("Supabase response:", { 
        posts: posts?.length || 0, 
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null 
      })

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        throw new Error(`Supabase error: ${error.message || 'Unknown error'}`);
      }

      // For now, return posts without reactions to test basic functionality
      return posts.map(post => ({
        ...post,
        reaction_counts: { upvotes: 0, hearts: 0, hugs: 0 },
        user_reactions: { upvote: false, heart: false, hug: false },
      }));
    } catch (error) {
      console.error("PostsService.getPosts error:", error)
      throw error;
    }
  }

  static async getPost(id: string): Promise<PostWithDetails> {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        reactions!inner(reaction_type, user_id)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error) throw error;

    // Get comments for this post
    const comments = await this.getCommentsForPost(id);

    // Process reaction counts and user reactions
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const reactions = post.reactions || [];
    
    const reactionCounts = {
      upvotes: reactions.filter((r: any) => r.reaction_type === 'upvote').length,
      hearts: reactions.filter((r: any) => r.reaction_type === 'heart').length,
      hugs: reactions.filter((r: any) => r.reaction_type === 'hug').length,
    };

    const userReactions = userId ? {
      upvote: reactions.some((r: any) => r.reaction_type === 'upvote' && r.user_id === userId),
      heart: reactions.some((r: any) => r.reaction_type === 'heart' && r.user_id === userId),
      hug: reactions.some((r: any) => r.reaction_type === 'hug' && r.user_id === userId),
    } : { upvote: false, heart: false, hug: false };

    return {
      ...post,
      reaction_counts: reactionCounts,
      user_reactions: userReactions,
      comments,
      reactions: undefined, // Remove raw reactions data
    };
  }

  static async updatePost(id: string, updates: Partial<CreatePostData>): Promise<Post> {
    const { data: post, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return post;
  }

  static async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  }

  // Comments CRUD Operations
  static async createComment(data: CreateCommentData): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const commentData = {
      ...data,
      author_id: user?.id,
      is_anonymous: data.is_anonymous ?? true,
    };

    const { data: comment, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;

    // Broadcast real-time update
    await supabase
      .channel(`post:${data.post_id}`)
      .send({
        type: 'broadcast',
        event: 'new_comment',
        payload: { comment }
      });

    return comment;
  }

  static async getCommentsForPost(postId: string): Promise<CommentWithDetails[]> {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        reactions!inner(reaction_type, user_id)
      `)
      .eq('post_id', postId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Process reaction counts and user reactions
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const processedComments = comments.map(comment => {
      const reactions = comment.reactions || [];
      const reactionCounts = {
        upvotes: reactions.filter((r: any) => r.reaction_type === 'upvote').length,
        hearts: reactions.filter((r: any) => r.reaction_type === 'heart').length,
        hugs: reactions.filter((r: any) => r.reaction_type === 'hug').length,
      };

      const userReactions = userId ? {
        upvote: reactions.some((r: any) => r.reaction_type === 'upvote' && r.user_id === userId),
        heart: reactions.some((r: any) => r.reaction_type === 'heart' && r.user_id === userId),
        hug: reactions.some((r: any) => r.reaction_type === 'hug' && r.user_id === userId),
      } : { upvote: false, heart: false, hug: false };

      return {
        ...comment,
        reaction_counts: reactionCounts,
        user_reactions: userReactions,
        children: [],
        reactions: undefined, // Remove raw reactions data
      };
    });

    // Build comment tree
    const commentMap = new Map<string, CommentWithDetails>();
    const rootComments: CommentWithDetails[] = [];

    processedComments.forEach(comment => {
      commentMap.set(comment.id, comment);
    });

    processedComments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  static async updateComment(id: string, updates: Partial<CreateCommentData>): Promise<Comment> {
    const { data: comment, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return comment;
  }

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  }

  // Reactions Operations
  static async toggleReaction(data: CreateReactionData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const reactionData = {
      ...data,
      user_id: user.id,
    };

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('reaction_type', data.reaction_type)
      .eq(data.post_id ? 'post_id' : 'comment_id', data.post_id || data.comment_id)
      .single();

    if (existingReaction) {
      // Remove existing reaction
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) throw error;
    } else {
      // Add new reaction
      const { error } = await supabase
        .from('reactions')
        .insert(reactionData);

      if (error) throw error;
    }

    // Broadcast real-time update
    const channelId = data.post_id ? `post:${data.post_id}` : `comment:${data.comment_id}`;
    await supabase
      .channel(channelId)
      .send({
        type: 'broadcast',
        event: 'reaction_updated',
        payload: { 
          post_id: data.post_id,
          comment_id: data.comment_id,
          reaction_type: data.reaction_type,
          action: existingReaction ? 'removed' : 'added'
        }
      });
  }

  // Reports Operations
  static async createReport(data: CreateReportData): Promise<Report> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const reportData = {
      ...data,
      reporter_id: user?.id,
    };

    const { data: report, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  static async getReports(status?: string): Promise<Report[]> {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reports, error } = await query;

    if (error) throw error;
    return reports;
  }

  static async updateReportStatus(id: string, status: string, reason?: string): Promise<Report> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData: any = {
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    };

    if (reason) {
      updateData.description = reason;
    }

    const { data: report, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  // Moderation Operations
  static async moderatePost(id: string, status: 'moderated' | 'deleted', reason: string): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        status,
        moderation_reason: reason,
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return post;
  }

  static async moderateComment(id: string, status: 'moderated' | 'deleted', reason: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        status,
        moderation_reason: reason,
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return comment;
  }

  // Moderation Dashboard Methods
  static async getPostsForModeration(): Promise<Post[]> {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .in('status', ['moderated', 'deleted'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts;
  }

  static async getCommentsForModeration(): Promise<Comment[]> {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .in('status', ['moderated', 'deleted'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return comments;
  }

  // User Role Management
  static async getUserRole(userId: string): Promise<{ data: UserRole | null, error: any }> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  }

  static async assignUserRole(userId: string, role: 'user' | 'moderator' | 'admin'): Promise<UserRole> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        granted_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  static subscribeToPostUpdates(postId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`post:${postId}`)
      .on('broadcast', { event: 'new_comment' }, callback)
      .on('broadcast', { event: 'reaction_updated' }, callback)
      .subscribe();
  }

  static subscribeToCommentsUpdates(commentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`comment:${commentId}`)
      .on('broadcast', { event: 'reaction_updated' }, callback)
      .subscribe();
  }

  // Utility functions
  static formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
} 