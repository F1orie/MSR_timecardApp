const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    const { data, error } = await supabase
        .from('profiles')
        .select('password_reset_required')
        .limit(1);

    if (error) {
        console.error('Error selecting column:', error.message);
    } else {
        console.log('Column exists. Data:', data);
    }
}

checkColumn();
