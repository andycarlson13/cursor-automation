#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute a command and log output
function runCommand(command, options = {}) {
  console.log(`\n> ${command}`);
  try {
    return execSync(command, {
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Function to prompt the user for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Main function
async function main() {
  console.log("\n=== Cursor Automation Setup ===\n");
  console.log("This script will set up your environment for using MCP agents with Cursor.\n");
  
  // Step 1: Install dependencies
  console.log("\nStep 1: Installing dependencies...");
  runCommand('npm install');
  
  // Step 2: Configure workspace directory
  console.log("\nStep 2: Configuring workspace directory...");
  const configureWorkspace = await confirm("Would you like to configure your workspace directory now?");
  if (configureWorkspace) {
    runCommand('node scripts/configure-workspace.js');
  } else {
    console.log("Skipping workspace configuration. You can run this later with: npm run configure-workspace");
  }
  
  // Step 3: Set up GitHub token
  console.log("\nStep 3: Setting up GitHub token...");
  const setupGithub = await confirm("Would you like to set up your GitHub Personal Access Token now?");
  if (setupGithub) {
    runCommand('node scripts/setup-github-token.js');
  } else {
    console.log("Skipping GitHub token setup. You can run this later with: npm run setup-github");
  }
  
  // Step 4: Initialize MCP configuration
  console.log("\nStep 4: Initializing MCP configuration...");
  const initMcp = await confirm("Would you like to initialize the MCP configuration now?");
  if (initMcp) {
    runCommand('node scripts/cursor-mcp-init.js --force');
  } else {
    console.log("Skipping MCP initialization. You can run this later with: npm run mcp-init-force");
  }

  // Step 5: Create help script
  console.log("\nStep 5: Creating a help script...");
  const helpScriptPath = path.join(process.cwd(), 'help.js');
  const helpScript = `#!/usr/bin/env node

console.log("\\n=== Cursor Automation Help ===\\n");
console.log("Available commands:\\n");
console.log("npm run configure-workspace  - Configure your workspace directory");
console.log("npm run setup-github        - Set up GitHub Personal Access Token");
console.log("npm run mcp-init            - Initialize MCP configuration");
console.log("npm run mcp-init-force      - Force restart MCP servers");
console.log("npm run start-all-mcp       - Start all MCP servers with detailed logging");
console.log("npm run stop-all-mcp        - Stop all MCP servers");
console.log("npm run test-mcp            - Test if MCP tools are working\\n");

console.log("For more information, see the README.md file.\\n");
`;
  fs.writeFileSync(helpScriptPath, helpScript);
  fs.chmodSync(helpScriptPath, '755');
  
  // Add help command to package.json
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.scripts) {
      packageJson.scripts.help = 'node help.js';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log("Added 'npm run help' command to package.json");
    }
  } catch (error) {
    console.error("Error updating package.json:", error.message);
  }
  
  // Completion message
  console.log("\n=== Setup Complete ===\n");
  console.log("Your Cursor Automation environment is now set up!");
  console.log("\nNext steps:");
  console.log("1. Start using MCP agents in Cursor");
  console.log("2. Run 'npm run help' to see available commands");
  console.log("3. Run 'npm run test-mcp' to verify everything is working\n");
  
  rl.close();
}

main().catch(error => {
  console.error("Setup failed:", error);
  process.exit(1);
}); 