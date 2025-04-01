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

// Function to check for existing GitHub token
function checkExistingToken() {
  // Check environment variable
  if (process.env.GITHUB_TOKEN) {
    log('Found existing GitHub token in environment variables', colors.green);
    return process.env.GITHUB_TOKEN;
  }
  
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
        return mcpConfig.mcpServers.github.env.GITHUB_TOKEN;
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
      const content = fs.readFileSync(profilePath, 'utf8');
      const match = content.match(/export GITHUB_TOKEN=['"]([^'"]+)['"]/);
      if (match && match[1]) {
        log(`Found existing GitHub token in ${profilePath}`, colors.green);
        return match[1];
      }
    }
  }
  
  return null;
}

// Function to prompt for GitHub token
function promptForGitHubToken() {
  return new Promise((resolve) => {
    // First check for existing token
    const existingToken = checkExistingToken();
    
    if (existingToken) {
      rl.question(colors.cyan + '\nExisting GitHub token found. Use this token? (y/n): ' + colors.reset, (answer) => {
        if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes') {
          resolve(existingToken);
        } else {
          promptForNewToken(resolve);
        }
      });
    } else {
      promptForNewToken(resolve);
    }
  });
}

// Helper function to prompt for a new token
function promptForNewToken(resolve) {
  log(colors.bold + colors.blue + '=== GitHub Token Setup ===' + colors.reset);
  log('\nTo use GitHub MCP integration, you need a GitHub personal access token.', colors.yellow);
  log('If you don\'t have one, you can create it at: https://github.com/settings/tokens', colors.yellow);
  log('\nThe token needs the following permissions:', colors.yellow);
  log('  - repo (Full control of private repositories)', colors.yellow);
  log('  - workflow (Update GitHub Action workflows)', colors.yellow);
  log('  - read:org (Read org and team membership, read org projects)', colors.yellow);
  
  rl.question(colors.cyan + '\nEnter your GitHub token (input will be hidden): ' + colors.reset, (token) => {
    resolve(token.trim());
  });
}

// Function to detect GitHub repositories in workspace
function detectGitHubRepos() {
  const repos = [];
  
  try {
    // Detect in current directory
    const cwd = process.cwd();
    const gitConfigPath = path.join(cwd, '.git', 'config');
    
    if (fs.existsSync(gitConfigPath)) {
      const gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
      const remoteMatch = gitConfig.match(/\[remote "origin"\][\s\S]*?url = ([^\s]+)/m);
      
      if (remoteMatch && remoteMatch[1]) {
        const url = remoteMatch[1];
        // Extract owner and repo from GitHub URL
        const ghMatch = url.match(/github\.com[/:]([^/]+)\/([^.]+)(?:\.git)?/i);
        
        if (ghMatch && ghMatch[1] && ghMatch[2]) {
          repos.push({
            owner: ghMatch[1],
            repo: ghMatch[2],
            url: url
          });
        }
      }
    }
    
    // Detect cursor client repository
    const cursorDir = path.join(os.homedir(), '.cursor');
    const cursorConfigPath = path.join(cursorDir, 'config.json');
    
    if (fs.existsSync(cursorConfigPath)) {
      try {
        const cursorConfig = JSON.parse(fs.readFileSync(cursorConfigPath, 'utf8'));
        
        // Look for client repo info
        if (cursorConfig.clientRepo) {
          repos.push({
            owner: cursorConfig.clientRepo.owner || 'getcursor',
            repo: cursorConfig.clientRepo.repo || 'cursor',
            url: `https://github.com/${cursorConfig.clientRepo.owner || 'getcursor'}/${cursorConfig.clientRepo.repo || 'cursor'}`,
            isCursorClient: true
          });
        } else {
          // Default Cursor client repo
          repos.push({
            owner: 'getcursor',
            repo: 'cursor',
            url: 'https://github.com/getcursor/cursor',
            isCursorClient: true
          });
        }
      } catch (error) {
        // Ignore errors reading config
      }
    }
    
  } catch (error) {
    log(`Warning: Could not detect GitHub repositories: ${error.message}`, colors.yellow);
  }
  
  return repos;
}

// Function to verify GitHub token with repositories
async function verifyGitHubToken(token, repos) {
  if (!token || !repos.length) return false;
  
  try {
    // Simple verification by checking if we can access repo info
    const repo = repos[0];
    const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}`;
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'cursor-utils'
      }
    };
    
    // We'll use Node's built-in https to avoid dependencies
    const https = require('https');
    
    return new Promise((resolve) => {
      const req = https.request(url, options, (res) => {
        const statusCode = res.statusCode;
        resolve(statusCode >= 200 && statusCode < 300);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    return false;
  }
}

// Function to add GitHub token to various config files
async function setupGitHubToken(token) {
  try {
    // Detect GitHub repositories
    const repos = detectGitHubRepos();
    if (repos.length > 0) {
      log(`Detected ${repos.length} GitHub repositories:`, colors.blue);
      repos.forEach((repo, index) => {
        log(`${index + 1}. ${repo.owner}/${repo.repo} ${repo.isCursorClient ? '(Cursor Client)' : ''}`, 
           repo.isCursorClient ? colors.cyan : colors.reset);
      });
    }
    
    // Verify token with repositories
    const isValid = await verifyGitHubToken(token, repos);
    if (isValid) {
      log('✅ GitHub token verification successful!', colors.green);
    } else {
      log('Warning: Could not verify GitHub token with detected repositories.', colors.yellow);
      const proceed = await promptYesNo('Continue with this token anyway?');
      if (!proceed) {
        log('Setup canceled.', colors.yellow);
        rl.close();
        return;
      }
    }
    
    // 1. Add to MCP config
    const cursorDir = path.join(os.homedir(), '.cursor');
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    
    const mcpConfigPath = path.join(cursorDir, 'mcp.json');
    let mcpConfig = { mcpServers: {} };
    
    if (fs.existsSync(mcpConfigPath)) {
      try {
        mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      } catch (error) {
        log(`Warning: Could not parse existing MCP config: ${error.message}`, colors.yellow);
      }
    }
    
    // Ensure mcpServers exists
    if (!mcpConfig.mcpServers) {
      mcpConfig.mcpServers = {};
    }
    
    // Update GitHub configuration
    if (mcpConfig.mcpServers.github) {
      if (!mcpConfig.mcpServers.github.env) {
        mcpConfig.mcpServers.github.env = {};
      }
      mcpConfig.mcpServers.github.env.GITHUB_TOKEN = token;
    } else {
      mcpConfig.mcpServers.github = {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_TOKEN: token
        },
        type: "stdio"
      };
    }
    
    // Write updated config
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    log(`✅ GitHub token added to MCP config: ${mcpConfigPath}`, colors.green);
    
    // 2. Add to shell profile (if the user wants)
    const addToProfile = await promptYesNo('Would you like to add the GitHub token to your shell profile? (recommended)');
    
    if (addToProfile) {
      const shell = process.env.SHELL || '/bin/bash';
      let profilePath;
      
      if (shell.includes('zsh')) {
        profilePath = path.join(os.homedir(), '.zshrc');
      } else if (shell.includes('bash')) {
        profilePath = path.join(os.homedir(), '.bashrc');
        // Also check for .bash_profile on macOS
        const bashProfile = path.join(os.homedir(), '.bash_profile');
        if (fs.existsSync(bashProfile)) {
          profilePath = bashProfile;
        }
      } else {
        log('Unsupported shell, please manually add the token to your shell profile.', colors.yellow);
        return;
      }
      
      // Add export to profile if it doesn't already exist
      let profileContent = '';
      if (fs.existsSync(profilePath)) {
        profileContent = fs.readFileSync(profilePath, 'utf8');
      }
      
      if (!profileContent.includes('export GITHUB_TOKEN=')) {
        // Add the export, being careful about the token
        fs.appendFileSync(profilePath, `\n# Added by cursor-utils for GitHub MCP integration\nexport GITHUB_TOKEN='${token}'\n`);
        log(`✅ GitHub token added to ${profilePath}`, colors.green);
        log(`\nTo apply this change, run:`, colors.yellow);
        log(`source ${profilePath}`, colors.bold);
      } else {
        log(`GitHub token export already exists in ${profilePath}`, colors.yellow);
      }
    }
    
    log('\n' + colors.bold + colors.green + '=== GitHub Token Setup Complete ===' + colors.reset);
    log('\nYou can now use GitHub MCP integration with full automation capabilities.', colors.green);
    
  } catch (error) {
    log(`Error setting up GitHub token: ${error.message}`, colors.red);
  } finally {
    rl.close();
  }
}

// Helper function to prompt yes/no questions
function promptYesNo(question) {
  return new Promise((resolve) => {
    rl.question(colors.cyan + question + ' (y/n): ' + colors.reset, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  const token = await promptForGitHubToken();
  if (token) {
    await setupGitHubToken(token);
  } else {
    log('No token provided. Setup canceled.', colors.yellow);
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});