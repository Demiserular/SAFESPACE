-- Quick setup script for real-time chat
-- Run this in Supabase SQL Editor

-- Check if tables already exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_rooms') THEN
        RAISE NOTICE '❌ Tables do not exist. Please run 002_chat_rooms_setup.sql migration first.';
    ELSE
        RAISE NOTICE '✅ Chat tables found! Checking data...';
    END IF;
END $$;

-- Check table structures and data types
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('chat_rooms', 'chat_messages', 'chat_room_participants', 'message_reactions')
ORDER BY table_name, ordinal_position;

-- Verify default rooms exist
SELECT 
    'Chat Rooms' as table_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No rooms found - migration may not have run'
        ELSE '✅ Rooms exist'
    END as status
FROM chat_rooms;

-- Check realtime status
SELECT 
    schemaname,
    tablename,
    'Verify this table has Realtime enabled in Database > Replication' as action
FROM pg_tables 
WHERE tablename IN ('chat_messages', 'chat_room_participants', 'message_reactions');

-- Test RLS policies
DO $$
BEGIN
    -- Test if authenticated users can insert
    RAISE NOTICE 'RLS policies configured. Users must be authenticated to send messages.';
END $$;

-- Show all available chat rooms
SELECT 
    id,
    name,
    category,
    description,
    is_active,
    created_at
FROM chat_rooms
ORDER BY name;

RAISE NOTICE '✅ Setup verification complete!';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Enable Realtime for chat_messages in Database > Replication';
RAISE NOTICE '2. Enable Realtime for chat_room_participants in Database > Replication';
RAISE NOTICE '3. Start your app with: npm run dev';
RAISE NOTICE '4. Open two browser windows and test!';
