const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
    // Read as UTF-16LE
    const content = fs.readFileSync(envPath, 'utf16le');

    const lines = content.split('\n');
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.includes('NEXT_PUBLIC_SUPABASE_URL')) {
            console.log('URL_LINE:' + trimmed);
        }
        if (trimmed.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
            console.log('KEY_LINE:' + trimmed);
        }
    });
}
