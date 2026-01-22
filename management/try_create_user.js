
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Manually define helper since we can't import TS easily in JS script without compile
function manualGenerateEmail(username, deptCode) {
    const encoded = Buffer.from(username, 'utf-8').toString('hex');
    return `${encoded}@${deptCode}.local`;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function tryCreateUser() {
    console.log('--- Simulating Create User ---');

    // 1. Get a Department
    const { data: depts, error: dErr } = await supabase.from('departments').select('*').limit(1);
    if (dErr || !depts || depts.length === 0) {
        console.error('CRITICAL: No departments found! Cannot create user.', dErr);
        return;
    }

    const dept = depts[0];
    console.log(`Using Department: ${dept.name} (Code: ${dept.code})`);

    const username = 'Test_A';
    const email = manualGenerateEmail(username, dept.code);
    const password = username; // default

    console.log(`Creating User: ${username}`);
    console.log(`Email: ${email}`);

    // 2. Create Auth User
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Simulated User',
            username: username, // 'SimulatedUser01'
            contact_email: 'simulated@test.com',
            department_code: dept.code,
            is_password_change_required: true
        }
    });

    if (error) {
        console.error('!!! CREATION FAILED !!!');
        console.error('Error Object:', JSON.stringify(error, null, 2));
        console.error('Message:', error.message);
    } else {
        console.log('SUCCESS! User created.');
        console.log('User ID:', data.user.id);

        // Clean up
        console.log('Cleaning up (deleting user)...');
        await supabase.auth.admin.deleteUser(data.user.id);
    }
}

tryCreateUser();
