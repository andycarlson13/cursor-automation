#!/usr/bin/env node

/**
 * Optimized MCP Configuration Script
 * 
 * Creates an optimized MCP configuration for maximum automation
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
  bold: '\x1b[1m'
};

// Helper function to log messages with color
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Function to find the git root of the current directory
function findGitRoot(dir) {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd: dir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    return null;
  }
}

// Function to find all Git repositories in a parent directory
function findAllGitRepos(parentDir) {
  try {
    // Find all directories that contain a .git folder
    const findCommand = `find "${parentDir}" -type d -name ".git" -maxdepth 3 | sed 's/\/.git$//'`;
    return execSync(findCommand, { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.error('Error finding git repositories:', error.message);
    return [];
  }
}

// Function to kill existing MCP servers
function killExistingMCPServers() {
  try {
    log('Stopping existing MCP servers...', colors.yellow);
    execSync('pkill -f "server-filesystem" || true', { stdio: 'inherit' });
    execSync('pkill -f "mcp-webresearch" || true', { stdio: 'inherit' });
    execSync('pkill -f "server-github" || true', { stdio: 'inherit' });
    execSync('pkill -f "server-puppeteer" || true', { stdio: 'inherit' });
    execSync('pkill -f "mcprouter" || true', { stdio: 'inherit' });
    log('Existing MCP servers stopped.', colors.green);
  } catch (error) {
    console.warn('Warning: Could not stop all MCP servers:', error.message);
  }
}

// Function to check for existing GitHub token
function getExistingGitHubToken() {
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
  
  if (repos.length > 0) {
    log(`Detected ${repos.length} GitHub repositories:`, colors.blue);
    repos.forEach((repo, index) => {
      log(`${index + 1}. ${repo.owner}/${repo.repo} ${repo.isCursorClient ? '(Cursor Client)' : ''}`, 
         repo.isCursorClient ? colors.cyan : colors.reset);
    });
  }
  
  return repos;
}

// Generate the optimized MCP configuration
function generateOptimizedConfig() {
  // Get the current working directory
  const cwd = process.cwd();
  
  // Find the git root for the current directory
  const gitRoot = findGitRoot(cwd);
  
  // Determine workspace directory
  let workspaceDir;
  if (gitRoot) {
    // If we're in a git repo, use its parent
    workspaceDir = path.dirname(gitRoot);
  } else {
    // Otherwise use a reasonable default
    workspaceDir = path.join(os.homedir(), 'Desktop', 'Work');
    
    // Try to find a likely project directory
    const possibleWorkspaces = [
      path.join(os.homedir(), 'Desktop', 'Work'),
      path.join(os.homedir(), 'Documents', 'Projects'),
      path.join(os.homedir(), 'Projects'),
      path.join(os.homedir(), 'code')
    ];
    
    for (const dir of possibleWorkspaces) {
      if (fs.existsSync(dir)) {
        workspaceDir = dir;
        break;
      }
    }
  }
  
  // Find all git repositories in the workspace
  const allRepos = findAllGitRepos(workspaceDir);
  
  log(`Found workspace directory: ${workspaceDir}`, colors.blue);
  if (allRepos.length > 0) {
    log(`Found ${allRepos.length} repositories in workspace`, colors.blue);
  }
  
  // Construct workspace glob pattern
  const workspaceGlob = `${workspaceDir}/**/*`;
  
  // Check if the .cursor directory exists, create if not
  const cursorDir = path.join(os.homedir(), '.cursor');
  if (!fs.existsSync(cursorDir)) {
    fs.mkdirSync(cursorDir, { recursive: true });
  }
  
  const mcpConfigPath = path.join(cursorDir, 'mcp.json');
  
  // Detect GitHub repositories
  const repos = detectGitHubRepos();
  
  // Get existing GitHub token
  const githubToken = getExistingGitHubToken();
  
  // Create GitHub config with token if available
  const githubConfig = {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    type: "stdio"
  };
  
  if (githubToken) {
    log('Using existing GitHub token for MCP configuration', colors.green);
    githubConfig.env = {
      "GITHUB_TOKEN": githubToken
    };
  } else {
    log('No GitHub token found. GitHub integration will require manual setup.', colors.yellow);
    log('Run "npm run setup-github" to set up GitHub integration.', colors.yellow);
    githubConfig.env = {
      "GITHUB_TOKEN": "${process.env.GITHUB_TOKEN}"
    };
  }
  
  // Create an optimized MCP configuration
  const optimizedConfig = {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", workspaceGlob],
        type: "stdio"
      },
      puppeteer: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        env: {
          "PUPPETEER_LAUNCH_OPTIONS": "{ \"headless\": true, \"args\": [\"--no-sandbox\"], \"timeout\": 60000 }",
          "ALLOW_DANGEROUS": "true"
        },
        type: "stdio"
      },
      github: githubConfig,
      webresearch: {
        command: "npx",
        args: ["-y", "@mzxrai/mcp-webresearch"],
        type: "stdio"
      },
      fetch: {
        command: "npx",
        args: ["-y", "mcprouter"],
        env: {
          "SERVER_KEY": "928gi2m8xwtay9"
        },
        type: "stdio"
      },
      sequentialthinking: {
        command: "npx",
        args: ["-y", "mcprouter"],
        env: {
          "SERVER_KEY": "76e32um8xwucnc"
        },
        type: "stdio"
      }
    }
  };
  
  // Write the optimized configuration to mcp.json
  fs.writeFileSync(mcpConfigPath, JSON.stringify(optimizedConfig, null, 2));
  log(`Optimized MCP configuration written to: ${mcpConfigPath}`, colors.green);
  
  return mcpConfigPath;
}

// Main function
async function main() {
  log(colors.bold + colors.blue + '=== Optimizing MCP Configuration for Full Automation ===' + colors.reset);
  
  // Kill existing MCP servers (optional)
  const forceKill = process.argv.includes('--force') || process.argv.includes('-f');
  if (forceKill) {
    killExistingMCPServers();
  }
  
  // Generate optimized configuration
  const configPath = generateOptimizedConfig();
  
  log('\n' + colors.bold + colors.green + '=== MCP Configuration Optimized Successfully ===' + colors.reset);
  log('\nTo start all MCP servers, run:', colors.yellow);
  log('npm run mcp-init-force', colors.bold);
  log('\nTo test MCP servers, run:', colors.yellow);
  log('npm run test-mcp', colors.bold);
  
  return 'MCP configuration optimized successfully';
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});