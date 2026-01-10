-- Upgrade chat_rooms table to support private rooms and codes

DO $$ 
BEGIN
    -- Rename max_participants to max_users if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'max_participants') THEN
        ALTER TABLE chat_rooms RENAME COLUMN max_participants TO max_users;
    END IF;

    -- Add max_users if it doesn't exist (and max_participants didn't exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'max_users') THEN
        ALTER TABLE chat_rooms ADD COLUMN max_users INTEGER DEFAULT 100;
    END IF;

    -- Add is_private column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'is_private') THEN
        ALTER TABLE chat_rooms ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add room_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'room_code') THEN
        ALTER TABLE chat_rooms ADD COLUMN room_code VARCHAR(20);
    END IF;
END $$;
