
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function hexEmail(username, code) {
    const hex = Buffer.from(username, 'utf-8').toString('hex');
    return `${hex}@${code}.local`;
}

async function debugAppLogic() {
    console.log('--- Debugging App Logic ---');

    // 1. Fetch Admin
    const { data: admin, error: aErr } = await supabase.from('profiles').select('*, departments(*)').eq('role', 'admin').limit(1).single();

    if (aErr || !admin) {
        console.error('CRITICAL: Could not fetch Admin!', aErr);
        return;
    }

    console.log(`Admin Found: ${admin.full_name}`);
    const dept = admin.departments;

    if (!dept) {
        console.error('CRITICAL: Admin has NO department! (Relation is null)');
        return;
    }

    const code = dept.code;
    console.log(`Department Code: '${code}' (Length: ${code.length})`);

    // 2. Prepare Data inputs
    const username = 'Test_A';
    const email = hexEmail(username, code);
    console.log(`Generated Email: ${email}`);

    // 3. Attempt Create User (Exactly as App does)
    console.log('Attempting createUser...');
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: username,
        email_confirm: true,
        user_metadata: {
            full_name: 'Aさん',
            username: username,
            contact_email: '',
            department_code: code, // Using the code from Admin's dept
            is_password_change_required: true
        }
    });

    if (error) {
        console.error('!!! FAILURE !!!');
        console.error(error);
    } else {
        console.log('SUCCESS! Created user with Admin Dept Code.');
        // Cleanup
        await supabase.auth.admin.deleteUser(data.user.id);
    }
}

debugAppLogic();
