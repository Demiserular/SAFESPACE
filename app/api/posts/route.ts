
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use environment variables or fallback to hardcoded values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrfmmigqlpcdjauslmze.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZm1taWdxbHBjZGphdXNsbXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTY1MTgsImV4cCI6MjA1NTM3MjUxOH0.08NsVQOdFl1yXz85_g8Zzkp1jtZOEd57SMfgBNV_1iA';

export async function GET(req: NextRequest) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('posts').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { title, content, category, author_id, anonymous_username, is_anonymous } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  // Get auth token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  
  // Create an authenticated Supabase client with the user's token
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Verify the user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }

  // Prepare insert data
  const insertData: any = { 
    title, 
    content,
    user_id: user.id,
    category: category || 'general',
    is_anonymous: is_anonymous ?? false,
    anonymous_username: is_anonymous ? anonymous_username : null,
    status: 'active'
  };

  console.log('Attempting to insert post with data:', insertData);
  
  const { data, error } = await supabase
    .from('posts')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Database insert error:', error);
    return NextResponse.json({ 
      error: `Failed to create post: ${error.message}` 
    }, { status: 500 });
  }

  return NextResponse.json(data);
}
