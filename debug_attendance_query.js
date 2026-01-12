
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

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

function generateAuthEmail(username, departmentCode) {
    const hexUsername = Buffer.from(username, 'utf-8').toString('hex');
    return `${hexUsername}@${departmentCode}.local`;
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('--- Setting up Test User ---');
    const username = 'test_debug_' + Date.now();
    const deptCode = '416'; // ABC
    const password = 'password123';
    const email = generateAuthEmail(username, deptCode);

    // 1. Create User (Admin)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            username: username,
            department_code: deptCode,
            full_name: 'Test Debug User'
        }
    });

    if (createError) {
        console.error('Failed to create test user:', createError);
        return;
    }
    const userId = userData.user.id;
    console.log('Test User Created:', userId);

    try {
        // 2. Login (Client)
        console.log('--- Logging in as Test User ---');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Login failed:', authError);
            return;
        }

        console.log('Login successful.');
        const today = new Date().toISOString().split('T')[0];

        // 3. Query
        console.log(`--- Querying Attendance for ${today} ---`);
        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                break_records (*)
            `)
            .eq('user_id', userId)
            .eq('date', today)
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) {
            console.error('Query Error Details:', error);
        } else {
            console.log('Query Success:', data);
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    } finally {
        // 4. Cleanup
        console.log('--- Cleaning up ---');
        await supabaseAdmin.auth.admin.deleteUser(userId);
    }
}

testQuery();
