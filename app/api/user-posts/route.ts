import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Store user post ownership in localStorage since database schema is limited
export async function GET(req: NextRequest) {
  try {
    // Get current user
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // For now, return user ID so frontend can track ownership
    return NextResponse.json({ userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { postId, action } = await req.json();
    
    // Get current user
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Store post ownership in a simple way
    if (action === 'claim') {
      // This could be expanded to use a separate ownership table if needed
      return NextResponse.json({ success: true, userId, postId });
    }

    return NextResponse.json({ success: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}