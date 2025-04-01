#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Process command line arguments
const args = process.argv.slice(2);
const forceInit = args.includes('--force') || args.includes('-f');

// Get the current working directory
const cwd = process.cwd();

// Add GitHub token compatibility
// Handle both GITHUB_TOKEN and GITHUB_PERSONAL_ACCESS_TOKEN
if (process.env.GITHUB_TOKEN && !process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_TOKEN;
}
if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN && !process.env.GITHUB_TOKEN) {
  process.env.GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
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

// Function to check if the specified MCP server is already running
function isMCPServerRunning(serverName) {
try {
const result = execSync(`ps aux | grep "${serverName}" | grep -v grep`, { stdio: ['pipe', 'pipe', 'ignore'] });
return result.toString().trim().length > 0;
} catch (error) {
return false;
}
}

// Function to check if any MCP server is running
function isAnyMCPServerRunning() {
const servers = [
'server-filesystem',
'mcp-webresearch',
'server-github',
'server-puppeteer',
'mcprouter',
'sequentialthinking',
'fetch'
];
  
  return servers.some(server => isMCPServerRunning(server));
}

// Function to kill existing MCP servers
function killExistingMCPServers() {
  try {
    console.log('Stopping existing MCP servers...');
    execSync('pkill -f "server-filesystem" || true', { stdio: 'inherit' });
    execSync('pkill -f "mcp-webresearch" || true', { stdio: 'inherit' });
    execSync('pkill -f "server-github" || true', { stdio: 'inherit' });
    execSync('pkill -f "server-puppeteer" || true', { stdio: 'inherit' });
    execSync('pkill -f "mcprouter" || true', { stdio: 'inherit' });
    console.log('Existing MCP servers stopped.');
  } catch (error) {
    console.warn('Warning: Could not stop all MCP servers:', error.message);
  }
}

// Check if MCP server is already running
if (isAnyMCPServerRunning() && !forceInit) {
  console.log('MCP servers are already running. Use --force to restart them.');
  process.exit(0);
} else if (isAnyMCPServerRunning() && forceInit) {
  killExistingMCPServers();
}

// Find the git root for the current directory
const gitRoot = findGitRoot(cwd);

// Determine workspace directory
let workspaceDir;
if (gitRoot) {
  // If we're in a git repo, use its parent
  workspaceDir = path.dirname(gitRoot);
} else {
  // Otherwise use a reasonable default
  workspaceDir = path.join(os.homedir(), 'Desktop');
  
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

// Get the cursor-utils directory
const cursorUtilsDir = path.join(workspaceDir, 'cursor-utils');

// Initialize all MCP servers
try {
  console.log('Initializing MCP servers...');
  
  // Construct workspace glob pattern, handling both specific repos and general directory
  let workspaceGlob;
  if (allRepos.length === 0) {
    console.log(`No git repositories found in ${workspaceDir}. Using directory pattern.`);
    workspaceGlob = `${workspaceDir}/**/*`;
  } else {
    console.log(`Found ${allRepos.length} repositories in ${workspaceDir}`);
    workspaceGlob = `${workspaceDir}/**/*`;
  }
  
  // Check if the .cursor directory exists, create if not
  const cursorDir = path.join(os.homedir(), '.cursor');
  if (!fs.existsSync(cursorDir)) {
    fs.mkdirSync(cursorDir, { recursive: true });
  }
  
  // Update the MCP configuration
  const mcpConfigPath = path.join(cursorDir, 'mcp.json');
  let mcpConfig = { mcpServers: {} };
  
  if (fs.existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      if (!mcpConfig.mcpServers) {
        mcpConfig.mcpServers = {};
      }
    } catch (error) {
      console.warn(`Warning: Could not parse existing MCP config: ${error.message}`);
    }
  }
  
  // Configure MCP servers
  mcpConfig.mcpServers = {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", workspaceGlob],
      type: "stdio"
    },
    puppeteer: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-puppeteer"],
      env: {
        "PUPPETEER_LAUNCH_OPTIONS": "{ \"headless\": true, \"args\": [\"--no-sandbox\"] }",
        "ALLOW_DANGEROUS": "true"
      },
      type: "stdio"
    },
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      type: "stdio"
    },
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
    },
    ...mcpConfig.mcpServers
  };
  
  // Remove the HTML to Markdown server section
  if (mcpConfig.mcpServers.htmltomarkdown) {
    delete mcpConfig.mcpServers.htmltomarkdown;
  }
  
  // Write updated configuration
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`Updated MCP configuration at ${mcpConfigPath}`);
  
  // Start MCP servers in the background
  console.log('Starting MCP servers in the background...');
  
  // Define all the server start commands
  const startCommands = [
    `npx -y @modelcontextprotocol/server-filesystem "${workspaceGlob}"`,
    `npx -y @modelcontextprotocol/server-puppeteer`,
    `npx -y @modelcontextprotocol/server-github`,
    `npx -y @mzxrai/mcp-webresearch`,
    `npx -y mcprouter`, // fetch
    `npx -y mcprouter`  // sequential
  ];
  
  // Start each server in the background
  for (const cmd of startCommands) {
    try {
      const isWindows = process.platform === 'win32';
      const bgCommand = isWindows 
        ? `start /B ${cmd}` 
        : `nohup ${cmd} > /dev/null 2>&1 &`;
      
      execSync(bgCommand, { stdio: 'inherit' });
    } catch (error) {
      console.warn(`Warning: Could not start command: ${cmd}`);
      console.warn(`  Error: ${error.message}`);
    }
  }
  
  console.log('MCP servers initialized successfully!');
  console.log('\nAvailable MCP Servers:');
  console.log('- filesystem: Access to files and directories');
  console.log('- puppeteer: Browser automation and UI analysis');
  console.log('- github: GitHub repository integration');
  console.log('- webresearch: Web search and content retrieval');
  console.log('- fetch: Enhanced fetch capabilities');
  console.log('- sequentialthinking: Sequential thinking for complex tasks');
} catch (error) {
  console.error('Failed to initialize MCP servers:', error.message);
  process.exit(1);
}
