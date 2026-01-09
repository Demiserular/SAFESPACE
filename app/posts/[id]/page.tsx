'use client';

import { use, useEffect, useState } from 'react';
import { getPost } from '@/lib/api_routes';
import { Post } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useSupabaseAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate UUID format
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  useEffect(() => {
    if (!id) return;

    // Validate UUID before making API call
    if (!isValidUUID(id)) {
      setError(`Invalid post ID format: "${id}". Post IDs must be UUIDs.`);
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const postData = await getPost(id);
        setPost(postData);
        setError(null);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Post not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base sm:text-lg text-muted-foreground whitespace-pre-wrap">
            {post.content}
          </p>
        </CardContent>
      </Card>

      {/* ThreadFlow™ Comments Section */}
      <CommentsSection postId={id} postAuthorId={post.user_id || ''} />
    </div>
  );
}