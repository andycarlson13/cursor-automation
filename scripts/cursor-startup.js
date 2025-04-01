#!/usr/bin/env node

/**
 * Cursor Startup Script
 * 
 * Runs automatically when Cursor starts to ensure MCP servers are running
 * with optimal configuration for full automation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

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

// Check for existing MCP servers and start if needed
async function ensureMCPServersRunning() {
  // List of MCP servers to check
  const servers = [
    { name: 'filesystem', check: 'server-filesystem', start: 'mcp-fs' },
    { name: 'puppeteer', check: 'server-puppeteer', start: 'mcp-puppeteer' },
    { name: 'github', check: 'server-github', start: 'mcp-github' },
    { name: 'webresearch', check: 'mcp-webresearch', start: 'mcp-webresearch' },
    { name: 'fetch', check: 'mcprouter.*928gi2m8xwtay9', start: 'mcp-fetch' },
    { name: 'sequentialthinking', check: 'mcprouter.*76e32um8xwucnc', start: 'mcp-sequential' }
  ];

  // Check status of each server
  const serverStatus = {};
  let allRunning = true;

  for (const server of servers) {
    try {
      const result = execSync(`ps aux | grep "${server.check}" | grep -v grep`, { stdio: ['pipe', 'pipe', 'ignore'] });
      const running = result.toString().trim().length > 0;
      serverStatus[server.name] = running;
      if (!running) allRunning = false;
    } catch (error) {
      serverStatus[server.name] = false;
      allRunning = false;
    }
  }

  // If all servers are running, no need to do anything
  if (allRunning) {
    log('All MCP servers are already running.', colors.green);
    return true;
  }

  // Check if GitHub token exists
  const githubTokenExists = await checkGitHubToken();

  // Start missing servers
  log('Starting missing MCP servers...', colors.yellow);

  for (const server of servers) {
    if (!serverStatus[server.name]) {
      log(`Starting ${server.name} MCP server...`, colors.yellow);
      try {
        // Special handling for GitHub if no token
        if (server.name === 'github' && !githubTokenExists) {
          log('GitHub token not found, prompting for setup...', colors.yellow);
          await setupGitHubToken();
        }
        
        // Start the server in background
        const subprocess = spawn('npm', ['run', server.start], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        subprocess.unref();
        log(`${server.name} MCP server started.`, colors.green);
      } catch (error) {
        log(`Error starting ${server.name} server: ${error.message}`, colors.red);
      }
    }
  }

  return true;
}

// Check for GitHub token
async function checkGitHubToken() {
  // Check environment variable
  if (process.env.GITHUB_TOKEN) {
    return true;
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
        return true;
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
        const match = content.match(/export GITHUB_TOKEN=['\"]([^'\"]+)['\"]/);;
        if (match && match[1]) {
          return true;
        }
      } catch (error) {
        // Ignore errors reading profile
      }
    }
  }

  return false;
}

// Setup GitHub token if needed
async function setupGitHubToken() {
  try {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    log('\n' + colors.bold + colors.blue + '=== GitHub Token Setup ===' + colors.reset);
    log('To use GitHub integration with full automation capabilities, you need a GitHub token.', colors.yellow);
    log('If you don\'t have a token, create one at: https://github.com/settings/tokens\n', colors.yellow);
    log('The token needs these permissions:', colors.yellow);
    log('  - repo (Full control of repositories)', colors.yellow);
    log('  - workflow (Update GitHub Action workflows)', colors.yellow);

    const token = await new Promise((resolve) => {
      rl.question(colors.cyan + 'Enter your GitHub token (leave empty to skip): ' + colors.reset, (answer) => {
        resolve(answer.trim());
        rl.close();
      });
    });

    if (token) {
      // Save to MCP config
      const cursorDir = path.join(os.homedir(), '.cursor');
      if (!fs.existsSync(cursorDir)) {
        fs.mkdirSync(cursorDir, { recursive: true });
      }
      
      const mcpConfigPath = path.join(cursorDir, 'mcp.json');
      let mcpConfig = { mcpServers: {} };
      
      if (fs.existsSync(mcpConfigPath)) {
        try {
          mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
          if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
        } catch (error) {
          // Use default config
        }
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
      
      // Write config
      fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
      log('GitHub token added to MCP configuration.', colors.green);

      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error setting up GitHub token: ${error.message}`, colors.red);
    return false;
  }
}

// Detect GitHub repositories for automation
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
            url: url,
            branch: getCurrentGitBranch(cwd)
          });
        }
      }
    }
  } catch (error) {
    // Silently continue
  }
  
  return repos;
}

// Get current Git branch
function getCurrentGitBranch(dir) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    return 'main';
  }
}

// Main function
async function main() {
  try {
    log(colors.bold + colors.magenta + '=== Cursor Full Automation Startup ===' + colors.reset);
    
    // Ensure MCP configuration is optimized
    const mcpConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
    if (!fs.existsSync(mcpConfigPath)) {
      log('Initializing optimized MCP configuration...', colors.yellow);
      execSync('node ./scripts/optimize-mcp-config.js', { stdio: 'inherit' });
    }
    
    // Start MCP servers if needed
    await ensureMCPServersRunning();
    
    // Detect current repository
    const repos = detectGitHubRepos();
    if (repos.length > 0) {
      const repo = repos[0];
      log(`\nDetected GitHub repository: ${repo.owner}/${repo.repo}`, colors.blue);
      log(`Current branch: ${repo.branch}`, colors.blue);
      log(`\nFull automation is ready. AI will commit changes to the current branch.`, colors.green);
    } else {
      log(`\nNo GitHub repository detected in current directory.`, colors.yellow);
      log(`Full automation is ready for file operations and analysis.`, colors.green);
    }
    
    log('\n' + colors.bold + colors.green + '=== Cursor is ready for full AI automation ===' + colors.reset);
    
  } catch (error) {
    log(`Error during startup: ${error.message}`, colors.red);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
});