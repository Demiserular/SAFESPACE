const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client with service role key for admin operations
const supabaseUrl = 'https://xrfmmigqlpcdjauslmze.supabase.co';
// Note: This would normally use the service role key, but we'll use the anon key for now
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZm1taWdxbHBjZGphdXNsbXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTY1MTgsImV4cCI6MjA1NTM3MjUxOH0.08NsVQOdFl1yXz85_g8Zzkp1jtZOEd57SMfgBNV_1iA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addReactionsRLSPolicies() {
  console.log('Adding RLS policies for reactions table...');
  
  // Check if we can query the reactions table first
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Current error when querying reactions:', error.message);
    } else {
      console.log('Reactions table query successful, data:', data);
    }
  } catch (err) {
    console.log('Error querying reactions table:', err.message);
  }
}

addReactionsRLSPolicies();