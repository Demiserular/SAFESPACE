const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrfmmigqlpcdjauslmze.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZm1taWdxbHBjZGphdXNsbXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTY1MTgsImV4cCI6MjA1NTM3MjUxOH0.08NsVQOdFl1yXz85_g8Zzkp1jtZOEd57SMfgBNV_1iA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createReactionsTable() {
  console.log('Creating reactions table...');
  
  // First, let's try to create the reactions table using RPC or direct SQL
  // Since we can't execute DDL directly with the anon key, let's try the RPC approach
  
  const reactionsTableSQL = `
    -- Create reactions table
    CREATE TABLE IF NOT EXISTS reactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('upvote', 'heart', 'hug')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(post_id, user_id, reaction_type),
        UNIQUE(comment_id, user_id, reaction_type),
        CHECK (
            (post_id IS NOT NULL AND comment_id IS NULL) OR 
            (post_id IS NULL AND comment_id IS NOT NULL)
        )
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
    
    -- Enable RLS
    ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Reactions are viewable by everyone" ON reactions FOR SELECT USING (true);
    CREATE POLICY "Authenticated users can create reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);
    CREATE POLICY "Users can update their own reactions" ON reactions FOR UPDATE USING (auth.uid() = user_id);
  `;
  
  try {
    // Try to execute using RPC (this likely won't work with anon key)
    const { data, error } = await supabase.rpc('exec_sql', { sql: reactionsTableSQL });
    
    if (error) {
      console.log('RPC approach failed:', error.message);
      console.log('You will need to run the SQL manually in the Supabase dashboard or with service role key.');
      console.log('SQL to execute:');
      console.log(reactionsTableSQL);
    } else {
      console.log('✅ Reactions table created successfully!');
    }
  } catch (err) {
    console.log('❌ Error creating reactions table:', err.message);
    console.log('You will need to run the following SQL manually in the Supabase dashboard:');
    console.log(reactionsTableSQL);
  }
}

createReactionsTable();