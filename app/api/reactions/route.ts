
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');
  const commentId = searchParams.get('comment_id');
  const count = searchParams.get('count');

  if (!postId && !commentId) {
    return NextResponse.json({ error: 'post_id or comment_id is required' }, { status: 400 });
  }

  // Validate UUID format
  if (postId && !uuidRegex.test(postId)) {
    console.log(`Invalid post_id format: ${postId}`);
    return NextResponse.json(
      { error: `Invalid post_id format: '${postId}'. Expected UUID.` },
      { status: 400 }
    );
  }

  if (commentId && !uuidRegex.test(commentId)) {
    console.log(`Invalid comment_id format: ${commentId}`);
    return NextResponse.json(
      { error: `Invalid comment_id format: '${commentId}'. Expected UUID.` },
      { status: 400 }
    );
  }

  const query = supabase.from('reactions').select('*', { count: 'exact' });

  if (postId) {
    query.eq('post_id', postId);
  } else if (commentId) {
    query.eq('comment_id', commentId);
  }

  if (count) {
    const { count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ count });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { post_id, comment_id, user_id, reaction_type } = await req.json();

  if (!user_id || !reaction_type) {
    return NextResponse.json({ error: 'user_id and reaction_type are required' }, { status: 400 });
  }

  if (!post_id && !comment_id) {
    return NextResponse.json({ error: 'post_id or comment_id is required' }, { status: 400 });
  }

  // Validate UUID formats
  if (post_id && !uuidRegex.test(post_id)) {
    return NextResponse.json(
      { error: `Invalid post_id format: '${post_id}'. Expected UUID.` },
      { status: 400 }
    );
  }

  if (comment_id && !uuidRegex.test(comment_id)) {
    return NextResponse.json(
      { error: `Invalid comment_id format: '${comment_id}'. Expected UUID.` },
      { status: 400 }
    );
  }

  if (!uuidRegex.test(user_id)) {
    return NextResponse.json(
      { error: `Invalid user_id format: '${user_id}'. Expected UUID.` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.from('reactions').insert({
    post_id,
    comment_id,
    user_id,
    reaction_type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { post_id, comment_id, user_id, reaction_type } = await req.json();

  if (!user_id || !reaction_type) {
    return NextResponse.json({ error: 'user_id and reaction_type are required' }, { status: 400 });
  }

  if (!post_id && !comment_id) {
    return NextResponse.json({ error: 'post_id or comment_id is required' }, { status: 400 });
  }

  const query = supabase.from('reactions').delete();

  if (post_id) {
    query.eq('post_id', post_id);
  } else if (comment_id) {
    query.eq('comment_id', comment_id);
  }

  query.eq('user_id', user_id);
  query.eq('reaction_type', reaction_type);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
