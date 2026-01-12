
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY; // Use service key to bypass RLS for admin view if available, else anon might be restricted

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local (Need URL and SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function listUsers() {
    console.log('--- Connecting to Supabase ---');

    // Get Profiles and Departments
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            username,
            full_name,
            role,
            departments (
                code,
                name
            )
        `);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    let output = '\n--- Registered Users ---\n';
    if (profiles.length === 0) {
        output += 'No users found.\n';
    } else {
        profiles.forEach(p => {
            output += `User: ${p.username} | Name: ${p.full_name} | Role: ${p.role} | DeptCode: ${p.departments?.code || 'N/A'} | DeptName: ${p.departments?.name || 'N/A'}\n`;
        });
    }

    output += '\nTo login as a worker:\n';
    output += '1. Department Code: (See DeptCode column above)\n';
    output += '2. User Name: (See User column above)\n';
    output += '3. Password: (Same as User Name)\n';

    console.log(output);
    fs.writeFileSync('users.log', output, 'utf8');

    console.log('\nTo login as a worker:');
    console.log('1. Department Code: (See DeptCode column above)');
    console.log('2. User Name: (See User column above)');
    console.log('3. Password: (Same as User Name)');
}

listUsers();
