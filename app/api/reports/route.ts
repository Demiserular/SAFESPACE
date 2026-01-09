
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');
  const commentId = searchParams.get('comment_id');
  const count = searchParams.get('count');

  if (!postId && !commentId) {
    return NextResponse.json({ error: 'post_id or comment_id is required' }, { status: 400 });
  }

  const query = supabase.from('reports').select('*', { count: 'exact' });

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
  const { post_id, comment_id, reporter_id, reason, description } = await req.json();

  if (!reporter_id || !reason) {
    return NextResponse.json({ error: 'reporter_id and reason are required' }, { status: 400 });
  }

  if (!post_id && !comment_id) {
    return NextResponse.json({ error: 'post_id or comment_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase.from('reports').insert({
    post_id,
    comment_id,
    reporter_id,
    reason,
    description,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
