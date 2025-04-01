#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');
const { execSync } = require('child_process');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for workspace directory
function promptForWorkspaceDir() {
  return new Promise((resolve) => {
    console.log('\n=== Workspace Directory Configuration ===');
    console.log('The Filesystem MCP server needs to know which directory to access.');
    console.log('This should be the main directory where your code/projects are stored.\n');
    
    // Try to detect common workspace directories
    const homeDir = os.homedir();
    const commonDirs = [
      path.join(homeDir, 'code'),
      path.join(homeDir, 'projects'),
      path.join(homeDir, 'workspace'),
      path.join(homeDir, 'repos'),
      path.join(homeDir, 'src'),
      path.join(homeDir, 'work'),
      path.join(homeDir, 'Work'),
      path.join(homeDir, 'Desktop', 'code'),
      path.join(homeDir, 'Desktop', 'projects'),
      path.join(homeDir, 'Desktop', 'work'),
      path.join(homeDir, 'Desktop', 'Work')
    ];
    
    const existingDirs = commonDirs.filter(dir => fs.existsSync(dir));
    
    if (existingDirs.length > 0) {
      console.log('Found possible workspace directories:');
      existingDirs.forEach((dir, index) => {
        console.log(`${index + 1}. ${dir}`);
      });
      console.log(`${existingDirs.length + 1}. Use custom directory`);
      
      rl.question(`\nSelect workspace directory [1-${existingDirs.length + 1}]: `, (answer) => {
        const selection = parseInt(answer.trim());
        
        if (!isNaN(selection) && selection > 0 && selection <= existingDirs.length) {
          resolve(existingDirs[selection - 1]);
        } else if (!isNaN(selection) && selection === existingDirs.length + 1) {
          rl.question('\nEnter custom workspace directory: ', (customDir) => {
            if (customDir && customDir.trim()) {
              const dir = customDir.trim();
              // Expand ~ if used
              const expandedDir = dir.startsWith('~') ? path.join(homeDir, dir.substring(1)) : dir;
              resolve(expandedDir);
            } else {
              console.log('No directory provided. Using home directory as fallback.');
              resolve(homeDir);
            }
          });
        } else {
          console.log('Invalid selection. Using home directory as fallback.');
          resolve(homeDir);
        }
      });
    } else {
      rl.question('Enter your workspace directory (where your code/projects are stored): ', (dir) => {
        if (dir && dir.trim()) {
          // Expand ~ if used
          const expandedDir = dir.startsWith('~') ? path.join(homeDir, dir.substring(1)) : dir.trim();
          resolve(expandedDir);
        } else {
          console.log('No directory provided. Using home directory as fallback.');
          resolve(homeDir);
        }
      });
    }
  });
}

// Function to save workspace configuration
function saveWorkspaceConfig(workspaceDir) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(workspaceDir)) {
      console.log(`\nWarning: Directory ${workspaceDir} does not exist.`);
      const createDir = fs.existsSync(path.dirname(workspaceDir));
      
      if (createDir) {
        fs.mkdirSync(workspaceDir, { recursive: true });
        console.log(`Created directory: ${workspaceDir}`);
      } else {
        console.log(`Unable to create directory. Please create it manually.`);
        return false;
      }
    }
    
    // 1. Save to shell profile
    const shell = process.env.SHELL || '';
    let profilePath;
    
    if (shell.includes('zsh')) {
      profilePath = path.join(os.homedir(), '.zshrc');
    } else if (shell.includes('bash')) {
      // On macOS, prefer .bash_profile if it exists
      const bashProfile = path.join(os.homedir(), '.bash_profile');
      const bashrc = path.join(os.homedir(), '.bashrc');
      
      profilePath = fs.existsSync(bashProfile) ? bashProfile : bashrc;
    } else {
      // Default to .profile for other shells
      profilePath = path.join(os.homedir(), '.profile');
    }
    
    console.log(`Using shell profile: ${profilePath}`);
    
    let profileContent = '';
    if (fs.existsSync(profilePath)) {
      profileContent = fs.readFileSync(profilePath, 'utf8');
    }
    
    // Remove any existing CURSOR_WORKSPACE_DIR export
    profileContent = profileContent.replace(/\nexport CURSOR_WORKSPACE_DIR=.*\n/g, '\n');
    
    // Add the new directory export
    profileContent += `\n# Added by cursor-automation for Filesystem MCP server\nexport CURSOR_WORKSPACE_DIR="${workspaceDir}"\n`;
    
    fs.writeFileSync(profilePath, profileContent);
    console.log(`Workspace directory saved to ${profilePath}`);
    
    // 2. Update package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts['mcp-fs']) {
        packageJson.scripts['mcp-fs'] = `npx -y @modelcontextprotocol/server-filesystem "${workspaceDir}"`;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`Updated mcp-fs script in package.json`);
      }
    }
    
    // 3. Update start-all-mcp.js if it exists
    const startAllMcpPath = path.join(process.cwd(), 'scripts', 'start-all-mcp.js');
    if (fs.existsSync(startAllMcpPath)) {
      let content = fs.readFileSync(startAllMcpPath, 'utf8');
      
      // This is a simple string replacement and might not work for all cases
      // A more robust approach would be to parse the JavaScript, but that's complex for a script
      if (content.includes('workspaceDir =')) {
        content = content.replace(
          /const\s+workspaceDir\s*=\s*process\.env\.CURSOR_WORKSPACE_DIR\s*\|\|\s*path\.resolve\([^)]*\)/,
          `const workspaceDir = process.env.CURSOR_WORKSPACE_DIR || "${workspaceDir}"`
        );
        fs.writeFileSync(startAllMcpPath, content);
        console.log(`Updated workspaceDir in start-all-mcp.js`);
      }
    }
    
    // 4. Update the MCP configuration in ~/.cursor/mcp.json if it exists
    const mcpConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
    if (fs.existsSync(mcpConfigPath)) {
      try {
        const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        
        if (mcpConfig.mcpServers && mcpConfig.mcpServers.filesystem && 
            mcpConfig.mcpServers.filesystem.args && mcpConfig.mcpServers.filesystem.args.length > 2) {
          // Update the path in the args array
          mcpConfig.mcpServers.filesystem.args[2] = workspaceDir;
          fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
          console.log(`Updated workspace path in MCP configuration: ${mcpConfigPath}`);
        }
      } catch (error) {
        console.error(`Error updating MCP configuration: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving workspace configuration: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Setting up workspace directory for Cursor Automation...');
    
    // Check if workspace is already configured
    let workspaceDir = process.env.CURSOR_WORKSPACE_DIR;
    
    if (workspaceDir) {
      console.log(`Current workspace directory: ${workspaceDir}`);
      
      const changeDir = await new Promise((resolve) => {
        rl.question('Change workspace directory? (y/N): ', (answer) => {
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (!changeDir) {
        console.log('Keeping existing workspace directory configuration.');
        rl.close();
        return;
      }
    }
    
    // Prompt for workspace directory
    workspaceDir = await promptForWorkspaceDir();
    
    // Save configuration
    const success = saveWorkspaceConfig(workspaceDir);
    
    if (success) {
      console.log('\nWorkspace directory configuration complete!');
      console.log(`Filesystem MCP server will now have access to: ${workspaceDir}`);
      console.log('\nTo apply the changes, restart your terminal or run:');
      console.log(`export CURSOR_WORKSPACE_DIR="${workspaceDir}"`);
    } else {
      console.log('\nFailed to configure workspace directory. Please try again or configure manually.');
    }
    
    rl.close();
  } catch (error) {
    console.error('Error configuring workspace directory:', error);
    process.exit(1);
  }
}

main(); 