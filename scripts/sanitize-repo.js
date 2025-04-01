#!/usr/bin/env node

/**
 * Repository Sanitization Script
 * 
 * This script helps sanitize the repository by:
 * 1. Removing sensitive files not tracked by .gitignore
 * 2. Sanitizing logs and test results
 * 3. Replacing any hardcoded user paths with generic placeholders
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Main function
async function main() {
  console.log("\n=== Repository Sanitization Tool ===\n");
  console.log("This script will help sanitize the repository by removing personal information.\n");
  
  // Step 1: Clean untracked files
  console.log("Step 1: Clean untracked files");
  const cleanUntracked = await confirm("Would you like to remove all untracked files and directories?");
  if (cleanUntracked) {
    try {
      console.log("Showing files that would be removed:");
      execSync('git clean -fdxn', { stdio: 'inherit' });
      
      const confirmClean = await confirm("\nProceed with removal?");
      if (confirmClean) {
        console.log("\nRemoving untracked files...");
        execSync('git clean -fdx', { stdio: 'inherit' });
        console.log("Untracked files removed");
      } else {
        console.log("Skipping removal of untracked files");
      }
    } catch (error) {
      console.error("Error cleaning untracked files:", error.message);
    }
  } else {
    console.log("Skipping untracked files cleanup");
  }
  
  // Step 2: Check for hardcoded user paths in files
  console.log("\nStep 2: Sanitize hardcoded paths");
  const sanitizePaths = await confirm("Would you like to scan and sanitize hardcoded user paths?");
  
  if (sanitizePaths) {
    // Get user home directory name to search for
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const username = path.basename(homeDir);
    
    console.log(`\nSearching for hardcoded references to: ${username} and ${homeDir}`);
    
    try {
      // Using grep to find potential references
      console.log("\nFiles that may contain personal paths:");
      execSync(`grep -r "${username}" --include="*.js" --include="*.json" --include="*.md" . || true`, { stdio: 'inherit' });
      
      const sanitize = await confirm("\nWould you like to replace these occurrences with generic placeholders?");
      if (sanitize) {
        // Replace username with placeholder
        execSync(`find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" -exec sed -i '' 's|${username}|username|g' {} \\; || true`);
        // Replace home directory with placeholder
        execSync(`find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" -exec sed -i '' 's|${homeDir}|/home/username|g' {} \\; || true`);
        console.log("Paths sanitized");
      } else {
        console.log("Skipping path sanitization");
      }
    } catch (error) {
      console.error("Error scanning for hardcoded paths:", error.message);
    }
  } else {
    console.log("Skipping path sanitization");
  }
  
  // Step 3: Create .env.example
  console.log("\nStep 3: Create template environment file");
  const createEnvExample = await confirm("Would you like to create a .env.example file?");
  
  if (createEnvExample) {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envExampleContent = 
`# GitHub MCP Integration
GITHUB_TOKEN=your_github_token_here

# Workspace Directory (default is ~/Desktop/Work)
CURSOR_WORKSPACE_DIR=/path/to/your/workspace

# Debug mode for detailed logging
# DEBUG=1
`;
    
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log(".env.example file created");
  } else {
    console.log("Skipping .env.example creation");
  }
  
  console.log("\n=== Sanitization Complete ===\n");
  console.log("Your repository should now be free of personal information.\n");
  console.log("Before sharing, it's recommended to review the files manually to ensure no sensitive information remains.");
  console.log("Use 'git status' to check for any remaining untracked files that should be ignored.");
  
  rl.close();
}

main().catch(error => {
  console.error("Sanitization failed:", error);
  process.exit(1);
}); 