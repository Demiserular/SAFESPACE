import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const userId = req.headers.get('x-user-id'); // Get from auth middleware

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already upvoted
    const { data: existingUpvote } = await supabase
      .from('comment_upvotes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingUpvote) {
      // Remove upvote
      await supabase
        .from('comment_upvotes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      // Decrement count
      await supabase.rpc('decrement_comment_upvotes', { comment_id: commentId });

      return NextResponse.json({ upvoted: false });
    } else {
      // Add upvote
      await supabase
        .from('comment_upvotes')
        .insert({ comment_id: commentId, user_id: userId });

      // Increment count
      await supabase.rpc('increment_comment_upvotes', { comment_id: commentId });

      return NextResponse.json({ upvoted: true });
    }
  } catch (error: any) {
    console.error('Upvote error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process upvote' },
      { status: 500 }
    );
  }
}
