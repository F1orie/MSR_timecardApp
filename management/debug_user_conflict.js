
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUser() {
    const username = 'Test_A';
    // We don't know the dept code for sure, so let's list all departments first
    const { data: depts, error: deptError } = await supabase.from('departments').select('*');

    if (deptError) {
        console.error('Error fetching departments:', deptError);
        return;
    }

    console.log('--- Departments ---');
    console.table(depts);

    console.log(`\n--- Checking for Username: ${username} ---`);

    // 1. Check Profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username);

    if (profileError) console.error('Profile Error:', profileError);
    console.log(`Found ${profiles?.length || 0} profiles for ${username}:`);
    console.log(profiles);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('List Users Error:', listError);
    } else {
        // Check match for "Test_A" hex
        const encoded = Buffer.from(username, 'utf-8').toString('hex')
        console.log(`Checking for User Hex: ${encoded}`);

        // Filter loose match
        const matches = users.filter(u => u.email && u.email.includes(encoded));

        if (matches.length === 0) {
            console.log("No Auth Users found with that hex.");
        }

        for (const u of matches) {
            console.log(`\n[Checking Auth User] ID: ${u.id}, Email: ${u.email}`);
            const { data: prof, error: profErr } = await supabase.from('profiles').select('id').eq('id', u.id).single();

            if (profErr || !prof) {
                console.warn(`!!! FOUND ORPHAN !!! User ${u.email} has NO profile. This is the blocker.`);
                console.log(`To fix: DELETE FROM auth.users WHERE id = '${u.id}';`);
            } else {
                console.log(`User ${u.email} is clean (has profile).`);
            }
        }
    }
}

debugUser();
