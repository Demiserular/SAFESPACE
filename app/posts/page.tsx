"use client"

import Link from 'next/link';
import { useEffect, useState, Suspense, lazy, useMemo, useCallback, memo } from 'react';
import { getPosts } from '@/lib/api_routes';
import { Post } from '@/lib/types';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, AlertTriangle, Heart, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: ''
  });

  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const isUserPost = (post: Post) => {
    console.log('Raw post data:', post);
    console.log('Raw user data:', user);
    
    const isOwner = user && (post.author_id === user.id || post.user_id === user.id);
    console.log('Checking post ownership:', {
      postId: post.id,
      postAuthorId: post.author_id,
      postUserId: post.user_id,
      currentUserId: user?.id,
      userIdType: typeof user?.id,
      postAuthorIdType: typeof post.author_id,
      isOwner,
      allPostFields: Object.keys(post),
      allUserFields: user ? Object.keys(user) : 'No user'
    });
    return isOwner;
  };

  // Toggle post expansion
  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const fetchPosts = async () => {
    try {
      const allPosts = await getPosts();
      console.log('All posts from API:', allPosts);
      console.log('Current user:', user);
      
      // Temporarily show all posts for debugging
      setPosts(allPosts);
      
      // Filter posts to only show current user's posts
      const userPosts = allPosts.filter(post => 
        user && (post.author_id === user.id || post.user_id === user.id)
      );
      console.log('Filtered user posts:', userPosts);
      // setPosts(userPosts); // Commented out for debugging
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      content: post.content,
      category: post.category
    });
    setEditDialogOpen(true);
  };

  const handleDeletePost = (post: Post) => {
    setDeletingPost(post);
    setDeleteDialogOpen(true);
  };

  const submitEdit = async () => {
    if (!editingPost || !user) return;

    try {
      // Get the session token
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please log in to edit posts');
        return;
      }

      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update post');
      }

      setEditDialogOpen(false);
      setError(null);
      fetchPosts();
      
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const submitDelete = async () => {
    if (!deletingPost || !user) return;

    try {
      // Get the session token
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please log in to delete posts');
        return;
      }

      const response = await fetch(`/api/posts/${deletingPost.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      setDeleteDialogOpen(false);
      setDeletingPost(null);
      setError(null);
      fetchPosts();
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-3 sm:py-4 lg:py-6 pb-20 sm:pb-6 max-w-[1800px]">
      {/* Header - Compact and Responsive */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4 lg:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-3xl font-bold truncate">My Posts</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Manage and view your posts</p>
        </div>
        <Link href="/create-post">
          <Button size="sm" className="h-8 sm:h-9 lg:h-10 px-3 sm:px-4 text-xs sm:text-sm shrink-0">
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden xs:inline">Create</span>
          </Button>
        </Link>
      </div>

      {error && (
        <Alert className="mb-3 sm:mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Posts Grid - Maximum Space Utilization */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg hover:border-primary/30 transition-all duration-200 relative overflow-hidden h-full flex flex-col border-border">
            {/* Action buttons - Compact and Visible */}
            {user && isUserPost(post) && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={() => handleEditPost(post)}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shadow-md border"
                  title="Edit post"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => handleDeletePost(post)}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shadow-md"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <CardHeader className="pb-2 sm:pb-3 pr-16 sm:pr-20 space-y-1">
              <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-2 leading-tight">{post.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <div className="space-y-2 mb-2 sm:mb-3 flex-1">
                <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${
                  !expandedPosts.has(post.id) && post.content.length > 150 ? 'line-clamp-3' : ''
                }`}>
                  {post.content}
                </p>
                
                {post.content.length > 150 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => togglePostExpansion(post.id)}
                    className="h-5 px-2 text-xs text-primary hover:text-primary/80 p-0"
                  >
                    {expandedPosts.has(post.id) ? 'Less' : 'More'}
                  </Button>
                )}
                
                <Link href={`/post/${post.id}`} className="block">
                  <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground">
                    Full discussion →
                  </Button>
                </Link>
              </div>
              
              {/* Footer - Compact Info */}
              <div className="flex flex-col gap-1.5 pt-2 border-t text-xs">
                <div className="flex items-center justify-between">
                  <span className="truncate text-muted-foreground">
                    {post.is_anonymous ? 
                      (post.anonymous_username || 'Anonymous') : 
                      'User'
                    }
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && user && (
        <div className="text-center py-8 sm:py-12 lg:py-16 px-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">You haven't created any posts yet. Start sharing your thoughts!</p>
          <Link href="/create-post">
            <Button size="sm" className="h-8 sm:h-9">
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="text-xs sm:text-sm">Create Your First Post</span>
            </Button>
          </Link>
        </div>
      )}

      {!user && (
        <div className="text-center py-8 sm:py-12 lg:py-16 px-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Please Log In</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">You need to be logged in to view your posts.</p>
          <Link href="/login">
            <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">Log In</Button>
          </Link>
        </div>
      )}

      {/* Edit Dialog - Compact */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg">Edit Post</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Make changes to your post below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1.5 block">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Post title"
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1.5 block">Category</label>
              <Input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                placeholder="Category"
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1.5 block">Content</label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Post content"
                rows={4}
                className="text-xs sm:text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={submitEdit} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitDelete}>
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}