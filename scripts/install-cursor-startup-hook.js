#!/usr/bin/env node

/**
 * Install Cursor Startup Hook
 * 
 * This script installs the cursor-startup.js script to run automatically when Cursor starts.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper function to log messages with color
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Main function
async function main() {
  log(colors.bold + colors.blue + '=== Installing Cursor Startup Hook ===' + colors.reset);
  
  try {
    // Get absolute path to the current directory
    const currentDir = process.cwd();
    
    // Get absolute path to the startup script
    const startupScriptPath = path.join(currentDir, 'scripts', 'cursor-startup.js');
    
    // Check if the script exists
    if (!fs.existsSync(startupScriptPath)) {
      throw new Error(`Startup script not found: ${startupScriptPath}`);
    }
    
    // Make script executable if it's not already
    try {
      execSync(`chmod +x "${startupScriptPath}"`, { stdio: 'ignore' });
    } catch (error) {
      log(`Warning: Could not make script executable: ${error.message}`, colors.yellow);
    }
    
    // Get Cursor config directory
    const cursorDir = path.join(os.homedir(), '.cursor');
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    
    // Create startup directory if needed
    const startupDir = path.join(cursorDir, 'startup');
    if (!fs.existsSync(startupDir)) {
      fs.mkdirSync(startupDir, { recursive: true });
    }
    
    // Create symlink to startup script
    const startupLinkPath = path.join(startupDir, 'cursor-automation.js');
    
    // Remove existing symlink if it exists
    if (fs.existsSync(startupLinkPath)) {
      fs.unlinkSync(startupLinkPath);
    }
    
    // Create symlink
    fs.symlinkSync(startupScriptPath, startupLinkPath, 'file');
    
    // Create Cursor startup script
    const cursorStartupScript = path.join(cursorDir, 'startup.js');
    
    // Create or update startup.js
    let startupContent = '';
    if (fs.existsSync(cursorStartupScript)) {
      startupContent = fs.readFileSync(cursorStartupScript, 'utf8');
    }
    
    // Add startup hook if not already present
    const startupHook = `
// Full Automation Startup Hook
try {
  require('./startup/cursor-automation.js');
} catch (error) {
  console.error('Error running cursor-automation startup hook:', error);
}
`;
    
    if (!startupContent.includes('cursor-automation.js')) {
      startupContent += startupHook;
      fs.writeFileSync(cursorStartupScript, startupContent);
      log('Added startup hook to Cursor startup.js', colors.green);
    } else {
      log('Startup hook already exists in Cursor startup.js', colors.yellow);
    }
    
    // Update package.json to include the new script
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add the script if it doesn't exist
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      packageJson.scripts['cursor-startup'] = 'node ./scripts/cursor-startup.js';
      packageJson.scripts['install-startup-hook'] = 'node ./scripts/install-cursor-startup-hook.js';
      
      // Add to bin if not already there
      if (!packageJson.bin) {
        packageJson.bin = {};
      }
      
      packageJson.bin['cursor-startup'] = './scripts/cursor-startup.js';
      
      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('Updated package.json with new scripts', colors.green);
    }
    
    log(colors.bold + colors.green + '\n=== Cursor Startup Hook Installed Successfully ===', colors.reset);
    log('\nThe full automation will now run automatically when Cursor starts.', colors.green);
    log('To test it, restart Cursor or run:', colors.cyan);
    log('npm run cursor-startup', colors.cyan);
    
  } catch (error) {
    log(`\nError installing startup hook: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});