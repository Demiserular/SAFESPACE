-- =============================================================================
-- FIX RLS POLICIES - Run this to fix the insert issues
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- POSTS POLICIES - FIXED VERSION

-- Allow everyone (including anon) to view active posts
CREATE POLICY "Posts are viewable by everyone"
    ON posts FOR SELECT
    USING (status = 'active');

-- Allow authenticated users to create posts
-- The user_id or author_id will be set by the application
CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (
        COALESCE(user_id, author_id) = auth.uid() OR 
        (user_id IS NULL AND author_id IS NULL)
    );

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR user_id = auth.uid());

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
    ON posts FOR DELETE
    TO authenticated
    USING (author_id = auth.uid() OR user_id = auth.uid());

-- =============================================================================
-- Also fix Comments policies
-- =============================================================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (
        COALESCE(user_id, author_id) = auth.uid() OR 
        (user_id IS NULL AND author_id IS NULL)
    );

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    TO authenticated
    USING (author_id = auth.uid() OR user_id = auth.uid());

-- =============================================================================
-- DONE! Try creating a post again
-- =============================================================================
