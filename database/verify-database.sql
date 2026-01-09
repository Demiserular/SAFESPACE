-- =============================================================================
-- Database Verification Script
-- =============================================================================
-- Run this after setup to verify everything is working correctly
-- =============================================================================

-- 1. Check all tables exist
SELECT 'Tables Created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check RLS is enabled on all tables
SELECT 'Row Level Security Status:' as status;
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check all indexes
SELECT 'Indexes Created:' as status;
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Check all RLS policies
SELECT 'RLS Policies:' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Check triggers
SELECT 'Triggers:' as status;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Check table structure
SELECT 'Posts Table Structure:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'posts'
ORDER BY ordinal_position;

-- 7. Count records (should be 0 for fresh setup)
SELECT 'Record Counts:' as status;
SELECT 
    'posts' as table_name, 
    COUNT(*) as record_count 
FROM posts
UNION ALL
SELECT 
    'comments' as table_name, 
    COUNT(*) as record_count 
FROM comments
UNION ALL
SELECT 
    'reactions' as table_name, 
    COUNT(*) as record_count 
FROM reactions
UNION ALL
SELECT 
    'reports' as table_name, 
    COUNT(*) as record_count 
FROM reports
UNION ALL
SELECT 
    'user_roles' as table_name, 
    COUNT(*) as record_count 
FROM user_roles;

-- =============================================================================
-- If all checks pass, your database is ready to use! 🎉
-- =============================================================================
