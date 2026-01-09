import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

async function checkAdminAccess(userId: string) {
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !userRole || !['admin', 'moderator'].includes(userRole.role)) {
    return false;
  }
  return true;
}

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } else {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    return session.user;
  }
}

// Admin: Get specific post with all details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAdminAccess = await checkAdminAccess(user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        comments(
          id,
          content,
          author_id,
          anonymous_username,
          is_anonymous,
          status,
          created_at
        ),
        reactions(
          id,
          reaction_type,
          user_id,
          created_at
        ),
        reports(
          id,
          reason,
          description,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin: Update post (including moderation actions)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAdminAccess = await checkAdminAccess(user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { 
      title, 
      content, 
      category, 
      status, 
      moderation_reason,
      is_anonymous 
    } = await req.json();

    let updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (is_anonymous !== undefined) updateData.is_anonymous = is_anonymous;
    
    // Handle moderation actions
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'moderated') {
        updateData.moderated_by = user.id;
        updateData.moderated_at = new Date().toISOString();
        updateData.moderation_reason = moderation_reason || 'Content moderated by admin';
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin: Delete post
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAdminAccess = await checkAdminAccess(user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Option 1: Soft delete (mark as deleted)
    const url = new URL(req.url);
    const hardDelete = url.searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete - permanently remove from database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Soft delete - mark as deleted
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'deleted',
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: 'Post deleted by admin'
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}