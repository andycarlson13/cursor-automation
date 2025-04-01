#!/usr/bin/env node

/**
 * GitHub Token Setup Script
 * 
 * This script helps set up a GitHub token for use with MCP GitHub integration
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const homedir = require('os').homedir();
const cursorDir = path.join(homedir, '.cursor');
const mcpConfigFile = path.join(cursorDir, 'mcp.json');

// Function to prompt the user for input
function prompt(message) {
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  console.log("\n=== GitHub Personal Access Token Setup ===\n");
  console.log("This script will help you set up a GitHub Personal Access Token for the MCP GitHub server.\n");
  console.log("Instructions to create a GitHub PAT:");
  console.log("1. Go to https://github.com/settings/tokens");
  console.log("2. Click 'Generate new token' (classic)");
  console.log("3. Give it a name like 'Cursor Automation'");
  console.log("4. Select the 'repo' scope (this grants access to repositories)");
  console.log("5. Click 'Generate token'");
  console.log("6. Copy the generated token\n");

  const token = await prompt("Enter your GitHub Personal Access Token: ");
  
  if (!token) {
    console.log("No token provided. Exiting without making changes.");
    process.exit(0);
  }

  // Update .env file if it exists, or create it
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      // Replace existing GITHUB_TOKEN if present
      if (envContent.includes('GITHUB_TOKEN=')) {
        envContent = envContent.replace(/GITHUB_TOKEN=.*(\n|$)/g, `GITHUB_TOKEN="${token}"\n`);
      } else if (envContent.includes('GITHUB_PERSONAL_ACCESS_TOKEN=')) {
        // Handle the old variable name if it exists
        envContent = envContent.replace(/GITHUB_PERSONAL_ACCESS_TOKEN=.*(\n|$)/g, `GITHUB_TOKEN="${token}"\n`);
      } else {
        // Add new line if needed
        if (!envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += `GITHUB_TOKEN="${token}"\n`;
      }
    } else {
      envContent = `GITHUB_TOKEN="${token}"\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("\n✅ GitHub token saved to .env file");
  } catch (error) {
    console.error("Error updating .env file:", error.message);
  }

  // Update ~/.cursor/mcp.json if it exists
  const mcpConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
  
  try {
    if (fs.existsSync(mcpConfigPath)) {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      
      // Check if github server is in the configuration
      const hasGithubServer = mcpConfig.servers && 
                             mcpConfig.servers.some(server => 
                               server.name === 'github' || 
                               (server.command && server.command.includes('server-github')));
      
      if (hasGithubServer) {
        // Update environment variables for github server
        mcpConfig.servers = mcpConfig.servers.map(server => {
          if (server.name === 'github' || (server.command && server.command.includes('server-github'))) {
            if (!server.env) {
              server.env = {};
            }
            server.env.GITHUB_TOKEN = token;
            // Also set the old variable name for backward compatibility
            server.env.GITHUB_PERSONAL_ACCESS_TOKEN = token;
          }
          return server;
        });
        
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        console.log("✅ GitHub token updated in MCP configuration");
      } else {
        console.log("⚠️ GitHub server not found in MCP configuration. Token will be used when the server is first initialized.");
      }
    } else {
      console.log("⚠️ MCP configuration not found. Token will be used when MCP is initialized.");
    }
  } catch (error) {
    console.error("Error updating MCP configuration:", error.message);
  }

  console.log("\n✨ GitHub token setup complete!");
  console.log("\nYour token is now configured for use with the MCP GitHub server.");
  console.log("If you need to update your token in the future, run this script again.");
  console.log("\nNOTE: For the changes to take effect, you may need to:");
  console.log("1. Restart any running MCP servers: npm run mcp-init-force");
  console.log("2. Restart Cursor\n");
  
  rl.close();
}

main().catch(error => {
  console.error("Setup failed:", error);
  process.exit(1);
});