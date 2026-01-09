export type Post = {
    id: string;
    title: string;
    content: string;
    category: string;
    author_id?: string;  // Made optional for compatibility
    user_id?: string;    // Added for database compatibility
    anonymous_username?: string;
    is_anonymous: boolean;
    status: 'active' | 'moderated' | 'deleted';
    moderation_reason?: string;
    moderated_by?: string;
    moderated_at?: string;
    created_at: string;
    updated_at: string;
};

export type Comment = {
    id: string;
    post_id: string;
    parent_comment_id?: string;
    content: string;
    author_id: string;
    anonymous_username?: string;
    is_anonymous: boolean;
    status: 'active' | 'moderated' | 'deleted';
    moderation_reason?: string;
    moderated_by?: string;
    moderated_at?: string;
    created_at: string;
    updated_at: string;
};

export type Reaction = {
    id: string;
    post_id?: string;
    comment_id?: string;
    user_id: string;
    reaction_type: 'upvote' | 'heart' | 'hug';
    created_at: string;
};

export type Report = {
    id: string;
    reporter_id: string;
    post_id?: string;
    comment_id?: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
};

export type CreatePostData = Omit<Post, 'id' | 'created_at' | 'updated_at' | 'author_id'>;
export type CreateCommentData = Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'author_id'>;
export type CreateReactionData = Omit<Reaction, 'id' | 'created_at'>;
export type CreateReportData = Omit<Report, 'id' | 'created_at' | 'reporter_id' | 'status' | 'reviewed_by' | 'reviewed_at'>;

export interface PostWithDetails extends Post {
  reaction_counts: { [key: string]: number };
  user_reactions: { [key: string]: boolean };
  comments: CommentWithDetails[];
}

export interface CommentWithDetails extends Comment {
  reaction_counts: { [key: string]: number };
  user_reactions: { [key: string]: boolean };
  children: CommentWithDetails[];
}

export type UserRole = {
    id: string;
    user_id: string;
    role: 'user' | 'moderator' | 'admin';
    granted_by: string;
    granted_at: string;
};