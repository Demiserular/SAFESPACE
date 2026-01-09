const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrfmmigqlpcdjauslmze.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set.');
    console.error('Please set the environment variable and try again.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dummyPosts = [
    {
        title: 'Feeling overwhelmed with work',
        content: 'Lately, I\'ve been feeling incredibly stressed and overwhelmed with my job. The deadlines are piling up, and I feel like I can\'t catch a break. It\'s starting to affect my sleep and my mood. Any advice on how to handle workplace stress?',
        category: 'Work',
        is_anonymous: true,
        anonymous_username: 'StressedOutDev'
    },
    {
        title: 'Struggling to make friends in a new city',
        content: 'I moved to a new city a few months ago for a new job, and I\'m finding it really hard to meet people and make friends. I feel pretty lonely most of the time. Has anyone been through this? How did you build a social circle from scratch?',
        category: 'Social Life',
        is_anonymous: true,
        anonymous_username: 'NewInTown'
    },
    {
        title: 'Dealing with creative block',
        content: 'I\'m a writer, and for the past few weeks, I\'ve been staring at a blank page. I feel completely drained of ideas and creativity. It\'s frustrating because writing is my passion. How do you overcome creative blocks?',
        category: 'Creativity',
        is_anonymous: true,
        anonymous_username: 'BlockedWriter'
    },
    {
        title: 'How to start a fitness journey?',
        content: 'I want to get healthier and start exercising, but I have no idea where to begin. The gym seems intimidating, and I\'m not sure what kind of workouts to do. Any tips for a complete beginner?',
        category: 'Health',
        is_anonymous: true,
        anonymous_username: 'FitnessNewbie'
    }
];

async function seedPosts() {
    try {
        console.log('Refreshing schema cache...');
        const { error: notifyError } = await supabase.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
        if (notifyError) {
            console.error('Error refreshing schema cache:', notifyError);
            // Don't return, as it might not be a fatal error
        } else {
            console.log('Schema cache refreshed.');
        }


        console.log('Starting to seed posts...');

        // 1. Delete all existing posts
        console.log('Deleting existing posts...');
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .gt('created_at', '1970-01-01T00:00:00Z'); // Delete all rows

        if (deleteError) {
            console.error('Error deleting posts:', deleteError);
            return;
        }
        console.log('Existing posts deleted.');

        // 2. Insert new dummy posts
        console.log('Inserting dummy posts...');
        const { data, error: insertError } = await supabase
            .from('posts')
            .insert(dummyPosts);

        if (insertError) {
            console.error('Error inserting posts:', insertError);
            return;
        }

        console.log('Dummy posts inserted successfully!');
        console.log('🎉 Posts seeding completed!');
    } catch (error) {
        console.error('❌ An unexpected error occurred during seeding:', error);
    }
}

seedPosts();
