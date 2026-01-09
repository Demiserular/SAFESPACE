
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Fallback to hardcoded values if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrfmmigqlpcdjauslmze.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZm1taWdxbHBjZGphdXNsbXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTY1MTgsImV4cCI6MjA1NTM3MjUxOH0.08NsVQOdFl1yXz85_g8Zzkp1jtZOEd57SMfgBNV_1iA';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Fetch comments with user information
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        author_id,
        user_id,
        anonymous_username,
        is_anonymous,
        status
      `)
      .eq('post_id', postId)
      .in('status', ['active', 'moderated']) // Include moderated comments too
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error fetching comments:', error);
      // Return empty array instead of error to prevent UI breakage
      return NextResponse.json([]);
    }

    // Transform comments to match ThreadFlow interface
    const transformedComments = (data || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author_id || comment.user_id || 'anonymous',
        username: comment.is_anonymous
          ? (comment.anonymous_username || 'Anonymous User')
          : (comment.anonymous_username || 'User'),
        avatar: undefined
      },
      createdAt: comment.created_at,
      upvotes: 0, // TODO: Implement upvote counting from reactions table
      reactions: {
        hearts: 0,
        hugs: 0,
        thumbs: 0
      },
      replyCount: 0, // Will be calculated client-side
      parentId: comment.parent_comment_id || undefined,
      isAuthor: false, // Will be set client-side
      hasUpvoted: false // Will be set client-side
    }));

    return NextResponse.json(transformedComments);
  } catch (err: any) {
    console.error('Unexpected error in GET /api/comments:', err);
    // Return empty array to prevent frontend breakage
    return NextResponse.json([]);
  }
} export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, parent_comment_id, content } = body;

    // Debug logging
    console.log('POST /api/comments received:', {
      post_id,
      parent_comment_id,
      content: content?.substring(0, 50)
    });

    if (!post_id || !content) {
      return NextResponse.json({ error: 'post_id and content are required' }, { status: 400 });
    }

    // Validate that post_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(post_id)) {
      console.error('Invalid post_id format:', post_id);
      return NextResponse.json({ error: `Invalid post_id format: "${post_id}". Expected UUID.` }, { status: 400 });
    }

    if (parent_comment_id && !uuidRegex.test(parent_comment_id)) {
      console.error('Invalid parent_comment_id format:', parent_comment_id);
      return NextResponse.json({ error: `Invalid parent_comment_id format: "${parent_comment_id}". Expected UUID.` }, { status: 400 });
    }

    // Get the authorization token from the request header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Please log in to comment' }, { status: 401 });
    }

    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create Supabase client with the user's token
    const authenticatedSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get the authenticated user's information
    const { data: { user: authUser }, error: authError } = await authenticatedSupabase.auth.getUser();

    if (authError || !authUser) {
      console.error('Failed to get authenticated user:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Insert comment with proper user_id (NOT author_id)
    const { data, error } = await authenticatedSupabase
      .from('comments')
      .insert({
        post_id,
        parent_comment_id: parent_comment_id || null,
        content,
        user_id: authUser.id,  // Use user_id from authenticated user
        is_anonymous: false,    // Set based on your app's logic
        status: 'active'
      })
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        user_id,
        anonymous_username,
        is_anonymous,
        status
      `)
      .single();

    if (error) {
      console.error('Supabase error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to match ThreadFlow format
    const transformedComment = {
      id: data.id,
      content: data.content,
      author: {
        id: data.user_id || 'anonymous',
        username: data.is_anonymous
          ? (data.anonymous_username || 'Anonymous User')
          : (data.anonymous_username || 'User'),
        avatar: undefined
      },
      createdAt: data.created_at,
      upvotes: 0,
      reactions: {
        hearts: 0,
        hugs: 0,
        thumbs: 0
      },
      replyCount: 0,
      parentId: data.parent_comment_id || undefined,
      isAuthor: false,
      hasUpvoted: false
    };

    return NextResponse.json(transformedComment);
  } catch (err: any) {
    console.error('Error in POST /api/comments:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
