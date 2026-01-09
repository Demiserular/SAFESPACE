import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;

  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('comment_id', commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const { user_id, reaction_type } = await req.json();

  if (!user_id || !reaction_type) {
    return NextResponse.json({ error: 'user_id and reaction_type are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reactions')
    .insert({
      comment_id: commentId,
      user_id,
      reaction_type,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const reactionType = searchParams.get('reaction_type');

  if (!userId || !reactionType) {
    return NextResponse.json({ error: 'user_id and reaction_type are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}