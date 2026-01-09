-- =====================================================
-- CLEAN CHAT ROOMS SETUP (Run this if you get errors)
-- =====================================================
-- This script will cleanly remove old tables and create new ones

-- Step 1: Drop all existing chat-related tables
DO $$ 
BEGIN
    -- Drop tables if they exist
    DROP TABLE IF EXISTS message_reactions CASCADE;
    DROP TABLE IF EXISTS chat_messages CASCADE;
    DROP TABLE IF EXISTS chat_room_participants CASCADE;
    DROP TABLE IF EXISTS chat_rooms CASCADE;
    
    RAISE NOTICE '✅ Old tables cleaned up';
END $$;

-- Step 2: Create fresh tables
-- Now run the main migration: 002_chat_rooms_setup.sql
