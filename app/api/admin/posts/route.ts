import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Admin endpoint to get all posts (including moderated/deleted)
export async function GET(req: NextRequest) {
  try {
    // Get user from auth header or session
    const authHeader = req.headers.get('authorization');
    let user;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (error || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
    } else {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = session.user;
    }

    // Check if user is admin or moderator
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || !['admin', 'moderator'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';

    let query = supabase
      .from('posts')
      .select(`
        *,
        user_roles!posts_author_id_fkey(role)
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}