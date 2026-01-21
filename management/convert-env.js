const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(process.cwd(), '.env.local');
const destPath = path.resolve(process.cwd(), 'env_fixed.txt');

if (fs.existsSync(srcPath)) {
    const content = fs.readFileSync(srcPath, 'utf16le');
    fs.writeFileSync(destPath, content, 'utf8');
    console.log('Converted to env_fixed.txt');
}
