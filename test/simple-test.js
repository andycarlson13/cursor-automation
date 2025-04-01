const fs = require('fs');
const path = require('path');

// Simple test to verify package.json is valid
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    console.log('✅ package.json is valid');
    console.log('✅ Project name:', packageJson.name);
    process.exit(0);
} catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    process.exit(1);
} 