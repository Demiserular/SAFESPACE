-- =============================================================================
-- Sample Test Data for Safe-Space Database
-- =============================================================================
-- Use this to populate your database with test data for development
-- WARNING: Only run this in development environment, not production!
-- =============================================================================

-- Note: You'll need to replace USER_ID_HERE with actual user IDs from auth.users
-- To get user IDs:
-- 1. Sign up users in your app
-- 2. Run: SELECT id, email FROM auth.users;
-- 3. Copy the IDs and replace below

-- =============================================================================
-- INSERT SAMPLE POSTS
-- =============================================================================

-- Sample Post 1
INSERT INTO posts (
    title, 
    content, 
    category, 
    anonymous_username, 
    is_anonymous,
    status
) VALUES (
    'Feeling overwhelmed with work deadlines',
    'I''ve been struggling to keep up with my workload lately. Every time I complete one task, three more appear. I''m starting to feel burnt out and don''t know how to approach my manager about this. Has anyone else experienced this?',
    'Career Stress',
    'WorkerBee42',
    true,
    'active'
);

-- Sample Post 2
INSERT INTO posts (
    title, 
    content, 
    category, 
    anonymous_username, 
    is_anonymous,
    status
) VALUES (
    'How do you cope with persistent sadness?',
    'For the past few months, I''ve been feeling down most days. I still go through the motions of daily life, but the joy is missing. Has anyone found effective ways to manage these feelings?',
    'Mental Health',
    'HopefulHiker',
    true,
    'active'
);

-- Sample Post 3
INSERT INTO posts (
    title, 
    content, 
    category, 
    anonymous_username, 
    is_anonymous,
    status
) VALUES (
    'Communication issues with my partner',
    'My partner and I seem to be talking past each other lately. We both have good intentions but end up in misunderstandings. Any advice for improving communication in a long-term relationship?',
    'Relationship Advice',
    'QuietObserver',
    true,
    'active'
);

-- Sample Post 4
INSERT INTO posts (
    title, 
    content, 
    category, 
    anonymous_username, 
    is_anonymous,
    status
) VALUES (
    'Dealing with anxiety in social situations',
    'I get really nervous in group settings, even with people I know. My heart races and I can''t think straight. Looking for coping strategies that have worked for others.',
    'Anxiety Support',
    'CalmSeeker',
    true,
    'active'
);

-- Sample Post 5
INSERT INTO posts (
    title, 
    content, 
    category, 
    anonymous_username, 
    is_anonymous,
    status
) VALUES (
    'Career change at 35 - is it too late?',
    'I''ve been in the same industry for 12 years and feeling unfulfilled. Thinking about switching careers but worried about starting over. Anyone made a successful career change later in life?',
    'Career',
    'NewBeginnings',
    true,
    'active'
);

-- =============================================================================
-- INSERT SAMPLE COMMENTS
-- =============================================================================

-- Get the first post ID for comments
DO $$
DECLARE
    v_post_id UUID;
BEGIN
    -- Get first post
    SELECT id INTO v_post_id FROM posts LIMIT 1;
    
    -- Insert comments for that post
    IF v_post_id IS NOT NULL THEN
        -- Comment 1
        INSERT INTO comments (
            post_id,
            content,
            anonymous_username,
            is_anonymous,
            status
        ) VALUES (
            v_post_id,
            'I completely understand how you feel. Setting boundaries with your manager might help. Have you tried scheduling a one-on-one to discuss workload?',
            'SupportiveFriend',
            true,
            'active'
        );
        
        -- Comment 2
        INSERT INTO comments (
            post_id,
            content,
            anonymous_username,
            is_anonymous,
            status
        ) VALUES (
            v_post_id,
            'This happened to me last year. I started using a priority matrix to manage tasks and it really helped. Also, don''t be afraid to say no sometimes!',
            'ProductivityPro',
            true,
            'active'
        );
    END IF;
END $$;

-- =============================================================================
-- INSERT SAMPLE REACTIONS (Requires actual user IDs)
-- =============================================================================

-- Uncomment and modify after you have real users:
/*
DO $$
DECLARE
    v_post_id UUID;
    v_user_id UUID;
BEGIN
    -- Get first post and user
    SELECT id INTO v_post_id FROM posts LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_post_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Add reactions
        INSERT INTO reactions (post_id, user_id, reaction_type)
        VALUES (v_post_id, v_user_id, 'heart')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO reactions (post_id, user_id, reaction_type)
        VALUES (v_post_id, v_user_id, 'upvote')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check inserted data
SELECT 'Sample Data Summary:' as status;

SELECT 
    'Posts' as table_name,
    COUNT(*) as count
FROM posts
UNION ALL
SELECT 
    'Comments' as table_name,
    COUNT(*) as count
FROM comments
UNION ALL
SELECT 
    'Reactions' as table_name,
    COUNT(*) as count
FROM reactions;

-- Show sample posts
SELECT 'Sample Posts Created:' as status;
SELECT 
    title,
    category,
    anonymous_username,
    created_at
FROM posts
ORDER BY created_at DESC;

-- =============================================================================
-- CLEANUP (if needed)
-- =============================================================================

-- Uncomment to delete all sample data:
/*
DELETE FROM reactions WHERE post_id IN (SELECT id FROM posts);
DELETE FROM comments WHERE post_id IN (SELECT id FROM posts);
DELETE FROM posts;
*/

-- =============================================================================
-- SUCCESS! Your database now has sample data for testing
-- =============================================================================
