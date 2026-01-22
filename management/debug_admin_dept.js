
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminAndDept() {
    console.log('--- Debugging Admin & Trigger Logic ---');

    // 1. List all departments
    const { data: depts, error: dErr } = await supabase.from('departments').select('*');
    if (dErr) console.error('Error fetching depts:', dErr);
    else {
        console.log('--- Departments List ---');
        depts.forEach(d => console.log(`[${d.id}] Code: ${d.code}, Name: ${d.name}`));
    }

    // 2. Checking Constraints on Profiles
    // We can't easily check constraints via JS client, but we can verify if we can insert a dummy profile manually (if we had a user).
    // Instead, let's check if there are any "weird" profiles.

    // 3. Check Admins
    const { data: admins } = await supabase.from('profiles').select('*, departments(*)').eq('role', 'admin');
    console.log('\n--- Admins ---');
    if (admins) {
        admins.forEach(a => {
            console.log(`Admin: ${a.full_name} (${a.username})`);
            console.log(`  - Admin Dept ID: ${a.department_id}`);
            // Check if this ID exists in depts
            const found = depts.find(d => d.id === a.department_id);
            if (found) {
                console.log(`  - LINK OK: Matches Dept "${found.name}" (Code: ${found.code})`);
                console.log(`  - Relation data:`, a.departments);
            } else {
                console.error(`  - [CRITICAL] BROKEN LINK: Dept ID ${a.department_id} NOT found in departments table!`);
            }
        });
    }

    // 4. Check for 'Test_A' in profiles specifically
    const { data: tests } = await supabase.from('profiles').select('*').ilike('username', 'test_%');
    console.log('\n--- Existing "test_" profiles ---');
    console.log(tests);
}

checkAdminAndDept();
