#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Path to log directory
const logDir = path.join(process.cwd(), 'mcp-logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Function to start an MCP server in the background
function startMcpServer(name, command, args = [], env = {}) {
  console.log(`Starting ${name} MCP server...`);
  
  // Create log files
  const outFile = fs.openSync(path.join(logDir, `${name}-out.log`), 'a');
  const errFile = fs.openSync(path.join(logDir, `${name}-err.log`), 'a');
  
  // Combine current environment with custom environment
  const processEnv = { 
    ...process.env, 
    ...env 
  };
  
  // Start process detached
  const childProcess = spawn(command, args, {
    detached: true,
    stdio: ['ignore', outFile, errFile],
    env: processEnv
  });
  
  // Unref process to allow parent to exit
  childProcess.unref();
  
  console.log(`${name} MCP server started with PID ${childProcess.pid}`);
  
  return childProcess.pid;
}

// Main function
async function main() {
  console.log('Starting all MCP servers...');
  
  // Check GitHub token
  const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!githubToken) {
    console.warn('WARNING: No GitHub token found in environment.');
    console.warn('GitHub MCP server may not work correctly.');
    console.warn('Run "npm run setup-github" to configure GitHub token.');
  } else {
    console.log('GitHub token found in environment variables.');
  }
  
  // Get workspace directory, with fallback to user's home directory
  const workspaceDir = process.env.CURSOR_WORKSPACE_DIR || path.join(os.homedir(), 'Desktop', 'Work');
  
  // MCP servers to start
  const servers = [
    {
      name: 'Filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', workspaceDir],
      env: {}
    },
    {
      name: 'Puppeteer',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      env: {
        PUPPETEER_LAUNCH_OPTIONS: '{ "headless": true, "args": ["--no-sandbox"] }',
        ALLOW_DANGEROUS: 'true'
      }
    },
    {
      name: 'GitHub',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {} // Uses GITHUB_PERSONAL_ACCESS_TOKEN from process.env
    },
    {
      name: 'WebResearch',
      command: 'npx',
      args: ['-y', '@mzxrai/mcp-webresearch'],
      env: {}
    },
    {
      name: 'Fetch',
      command: 'npx',
      args: ['-y', 'mcprouter'],
      env: {
        SERVER_KEY: '928gi2m8xwtay9'
      }
    },
    {
      name: 'Sequential',
      command: 'npx',
      args: ['-y', 'mcprouter'],
      env: {
        SERVER_KEY: '76e32um8xwucnc'
      }
    }
  ];
  
  // Start all servers
  const pids = [];
  for (const server of servers) {
    try {
      const pid = startMcpServer(server.name, server.command, server.args, server.env);
      pids.push({ name: server.name, pid });
    } catch (err) {
      console.error(`Error starting ${server.name} MCP server:`, err);
    }
  }
  
  // Save PIDs to file for later cleanup
  fs.writeFileSync(path.join(process.cwd(), 'mcp-pids.json'), JSON.stringify(pids, null, 2));
  
  console.log('\nAll MCP servers started!');
  console.log(`Log files are available in: ${logDir}`);
  console.log('To check if servers are running, use: npm run test-mcp');
}

// Run main function
main().catch(err => {
  console.error('Error starting MCP servers:', err);
  process.exit(1);
}); 