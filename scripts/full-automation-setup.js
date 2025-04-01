#!/usr/bin/env node

/**
 * Full Automation Setup Script
 * 
 * Comprehensive setup script for maximum MCP automation capabilities
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper function to log messages with color
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Main function to run all optimization tasks
async function main() {
  log(colors.bold + colors.blue + '=== Full Automation Setup ===' + colors.reset);
  
  try {
    // Step 1: Stop any running MCP servers
    log('\n' + colors.bold + '1. Stopping existing MCP servers...' + colors.reset);
    try {
      execSync('pkill -f "server-filesystem" || true', { stdio: 'inherit' });
      execSync('pkill -f "mcp-webresearch" || true', { stdio: 'inherit' });
      execSync('pkill -f "server-github" || true', { stdio: 'inherit' });
      execSync('pkill -f "server-puppeteer" || true', { stdio: 'inherit' });
      execSync('pkill -f "mcprouter" || true', { stdio: 'inherit' });
      log('Existing MCP servers stopped.', colors.green);
    } catch (error) {
      log('Warning: Could not stop all MCP servers: ' + error.message, colors.yellow);
    }
    
    // Step 2: Run the optimization script
    log('\n' + colors.bold + '2. Optimizing MCP configuration...' + colors.reset);
    execSync('node ./scripts/optimize-mcp-config.js', { stdio: 'inherit' });
    
    // Step 3: Check for existing GitHub token and setup if needed
    log('\n' + colors.bold + '3. GitHub Integration Setup' + colors.reset);
    
    // Check for existing GitHub token
    let hasGithubToken = false;
    
    // Check environment variable
    if (process.env.GITHUB_TOKEN) {
      log('Found existing GitHub token in environment variables', colors.green);
      hasGithubToken = true;
    } else {
      // Check in MCP config
      const cursorDir = path.join(os.homedir(), '.cursor');
      const mcpConfigPath = path.join(cursorDir, 'mcp.json');
      
      if (fs.existsSync(mcpConfigPath)) {
        try {
          const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
          if (mcpConfig.mcpServers && 
              mcpConfig.mcpServers.github && 
              mcpConfig.mcpServers.github.env && 
              mcpConfig.mcpServers.github.env.GITHUB_TOKEN) {
            log('Found existing GitHub token in MCP configuration', colors.green);
            hasGithubToken = true;
          }
        } catch (error) {
          // Ignore errors reading config
        }
      }
      
      // Check in shell profile files
      const profilePaths = [
        path.join(os.homedir(), '.zshrc'),
        path.join(os.homedir(), '.bashrc'),
        path.join(os.homedir(), '.bash_profile')
      ];
      
      for (const profilePath of profilePaths) {
        if (fs.existsSync(profilePath)) {
          try {
            const content = fs.readFileSync(profilePath, 'utf8');
            const match = content.match(/export GITHUB_TOKEN=['"]([^'"]+)['"]/);
            if (match && match[1]) {
              log(`Found existing GitHub token in ${profilePath}`, colors.green);
              hasGithubToken = true;
              break;
            }
          } catch (error) {
            // Ignore errors reading profile
          }
        }
      }
    }
    
    if (!hasGithubToken) {
      // Ask if user wants to set up GitHub token now
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question(colors.cyan + 'No GitHub token found. Set up GitHub integration now? (y/n): ' + colors.reset, (answer) => {
          resolve(answer.trim().toLowerCase());
          rl.close();
        });
      });
      
      if (answer === 'y' || answer === 'yes') {
        // Run GitHub token setup
        log('Running GitHub token setup...', colors.yellow);
        execSync('node ./scripts/setup-github-token.js', { stdio: 'inherit' });
      } else {
        log('Skipping GitHub integration setup.', colors.yellow);
        log('You can set it up later with:', colors.yellow);
        log('npm run setup-github', colors.yellow);
      }
    } else {
      log('GitHub token is already configured.', colors.green);
    }
    
    // Step 4: Start MCP servers
    log('\n' + colors.bold + '4. Starting optimized MCP servers...' + colors.reset);
    execSync('node ./scripts/cursor-mcp-init.js --force', { stdio: 'inherit' });
    
    // Step 5: Run tests
    log('\n' + colors.bold + '5. Testing MCP servers...' + colors.reset);
    execSync('node ./scripts/test-all-mcp-tools.js', { stdio: 'inherit' });
    
    // Final success message
    log('\n' + colors.bold + colors.green + '=== Full Automation Setup Complete ===' + colors.reset);
    log('\nYour Cursor environment is now configured for maximum AI automation capabilities.', colors.green);
    log('\nNext steps:', colors.cyan);
    if (!hasGithubToken) {
      log('1. Set up GitHub token: npm run setup-github', colors.cyan);
      log('2. Restart Cursor editor to apply changes', colors.cyan);
      log('3. Use the MCP tools for AI automation in your projects', colors.cyan);
    } else {
      log('1. Restart Cursor editor to apply changes', colors.cyan);
      log('2. Use the MCP tools for AI automation in your projects', colors.cyan);
    }
    
  } catch (error) {
    log(`\n${colors.bold}${colors.red}Error: ${error.message}${colors.reset}`);
    log('Please check the error message and try again.', colors.yellow);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});