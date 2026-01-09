import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check if posts table exists and what columns it has
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (postsError) {
      return NextResponse.json({ 
        error: 'Posts table error', 
        details: postsError.message 
      }, { status: 500 });
    }

    const schema = posts && posts.length > 0 ? Object.keys(posts[0]) : [];

    // Try to get table info from information_schema if possible
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'posts' })
      .single();

    return NextResponse.json({
      message: 'Schema check successful',
      postsTableExists: true,
      sampleColumns: schema,
      postsCount: posts?.length || 0,
      tableInfo: tableInfo || 'Unable to get detailed table info',
      tableInfoError: tableError?.message || null
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}