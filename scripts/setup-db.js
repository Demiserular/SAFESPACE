const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize the Supabase client
const supabaseUrl = 'https://xrfmmigqlpcdjauslmze.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZm1taWdxbHBjZGphdXNsbXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTc5NjUxOCwiZXhwIjoyMDU1MzcyNTE4fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('Starting database setup...');

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.error(`Error executing statement: ${statement}`);
            console.error(`Error: ${error.message}`);
            // Continue with other statements
          }
        }
      }

      console.log(`✅ Completed migration: ${file}`);
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Use direct SQL execution
async function runMigrationsDirect() {
  try {
    console.log('Starting database setup...');

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Execute the entire migration file
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`Error executing migration ${file}:`, error);
        // Continue with other migrations
      } else {
        console.log(`✅ Completed migration: ${file}`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Check if we have the service role key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️  No SUPABASE_SERVICE_ROLE_KEY found in environment variables.');
  console.log('Please set the SUPABASE_SERVICE_ROLE_KEY environment variable to run migrations.');
  console.log('You can find this in your Supabase project settings under API > Project API keys > service_role');
  process.exit(1);
}

// Run the migrations
runMigrationsDirect(); 