-- =====================================================
-- CHAT ROOMS & REAL-TIME MESSAGING SETUP
-- =====================================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_room_participants CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- 1. Create chat_rooms table
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    max_users INTEGER DEFAULT 100,
    is_private BOOLEAN DEFAULT FALSE,
    room_code VARCHAR(20)
);

-- 2. Create chat_messages table with real-time support
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    content TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT content_length CHECK (char_length(content) <= 2000)
);

-- 3. Create chat_room_participants table (for tracking active users)
CREATE TABLE chat_room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_online BOOLEAN DEFAULT TRUE,
    UNIQUE(room_id, user_id)
);

-- 4. Create message_reactions table
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_participants_room_id ON chat_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_participants_user_id ON chat_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- 6. Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for chat_rooms
CREATE POLICY "Anyone can view active chat rooms" ON chat_rooms
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update their rooms" ON chat_rooms
    FOR UPDATE USING (auth.uid() = created_by);

-- 8. RLS Policies for chat_messages
CREATE POLICY "Anyone can view messages in active rooms" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE id = chat_messages.room_id 
            AND is_active = TRUE
        )
    );

CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- 9. RLS Policies for chat_room_participants
CREATE POLICY "Anyone can view participants" ON chat_room_participants
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can join rooms" ON chat_room_participants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own participant status" ON chat_room_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON chat_room_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 10. RLS Policies for message_reactions
CREATE POLICY "Anyone can view reactions" ON message_reactions
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can add reactions" ON message_reactions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove their own reactions" ON message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Function to update last_seen for participants
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_room_participants
    SET last_seen = NOW(), is_online = TRUE
    WHERE room_id = NEW.room_id AND user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Trigger to update last_seen when message is sent
CREATE TRIGGER update_last_seen_on_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_last_seen();

-- 15. Function to get active user count for a room
CREATE OR REPLACE FUNCTION get_active_users_count(room_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM chat_room_participants
        WHERE room_id = room_uuid 
        AND is_online = TRUE
        AND last_seen > NOW() - INTERVAL '5 minutes'
    );
END;
$$ LANGUAGE plpgsql;

-- 16. Insert default chat rooms
INSERT INTO chat_rooms (name, description, category) VALUES
    ('Student Support Hub', 'A safe space for students to discuss academic stress and life challenges', 'Student Life'),
    ('Mental Wellness Circle', 'Supportive community for mental health discussions and coping strategies', 'Mental Health'),
    ('Fitness Motivation', 'Get motivated and stay accountable with your fitness goals', 'Fitness'),
    ('Creative Corner', 'Share your creative projects and get inspired by others', 'Creativity'),
    ('Study Group', 'Collaborate on assignments and study together', 'Academic'),
    ('Career Guidance', 'Get advice on career paths and job opportunities', 'Career')
ON CONFLICT DO NOTHING;

-- 17. Enable Realtime for chat_messages (Critical for real-time messaging)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- 18. Grant permissions for realtime
GRANT SELECT ON chat_messages TO authenticated;
GRANT INSERT ON chat_messages TO authenticated;
GRANT UPDATE ON chat_messages TO authenticated;
GRANT DELETE ON chat_messages TO authenticated;

GRANT SELECT ON chat_room_participants TO authenticated;
GRANT INSERT ON chat_room_participants TO authenticated;
GRANT UPDATE ON chat_room_participants TO authenticated;
GRANT DELETE ON chat_room_participants TO authenticated;

GRANT SELECT ON message_reactions TO authenticated;
GRANT INSERT ON message_reactions TO authenticated;
GRANT DELETE ON message_reactions TO authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
