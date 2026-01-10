const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrfmmigqlpcdjauslmze.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZm1taWdxbHBjZGphdXNsbXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTY1MTgsImV4cCI6MjA1NTM3MjUxOH0.08NsVQOdFl1yXz85_g8Zzkp1jtZOEd57SMfgBNV_1iA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking available tables...');
  
  // Try to list all tables by attempting to query common ones
  const tables = ['posts', 'comments', 'reactions', 'reports', 'user_roles', 'chat_rooms', 'chat_messages'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': exists, sample data:`, data.length > 0 ? 'has data' : 'empty');
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
}

checkTables();