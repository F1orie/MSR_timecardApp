
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAdmins() {
    console.log('--- Checking All Admins ---');

    const { data: depts } = await supabase.from('departments').select('*');
    const { data: admins } = await supabase.from('profiles').select('*').eq('role', 'admin');

    if (!admins) { console.log('No admins found'); return; }

    admins.forEach(a => {
        const d = depts.find(dept => dept.id === a.department_id);
        if (d) {
            console.log(`[OK] Admin: ${a.full_name}, Dept: ${d.name} (${d.code})`);
        } else {
            console.log(`[BROKEN] Admin: ${a.full_name}, Dept ID: ${a.department_id} (NOT FOUND)`);
        }
    });
}

listAdmins();
