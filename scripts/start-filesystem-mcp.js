#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Check for debug mode
const DEBUG = process.env.DEBUG === '1';
const log = (...args) => console.log(...args);
const debug = (...args) => DEBUG && console.log('[DEBUG]', ...args);

debug('Starting in debug mode');

// Get workspace directory
const workspaceDir = path.join(os.homedir(), 'Desktop', 'Work');
const cursorUtilsDir = path.join(workspaceDir, 'cursor-utils');
const enhancedPuppeteerPath = path.join(cursorUtilsDir, 'scripts', 'puppeteer-mcp-enhanced.js');

debug('Workspace directory:', workspaceDir);
debug('Cursor utils directory:', cursorUtilsDir);
debug('Enhanced Puppeteer path:', enhancedPuppeteerPath);

// Update MCP config
const cursorDir = path.join(os.homedir(), '.cursor');
const mcpConfigPath = path.join(cursorDir, 'mcp.json');

if (!fs.existsSync(cursorDir)) {
  debug('Creating cursor directory:', cursorDir);
  fs.mkdirSync(cursorDir, { recursive: true });
}

// Read or create MCP config
let mcpConfig = { mcpServers: {} };
if (fs.existsSync(mcpConfigPath)) {
  try {
    debug('Reading existing MCP config from:', mcpConfigPath);
    mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    if (!mcpConfig.mcpServers) {
      mcpConfig.mcpServers = {};
    }
  } catch (error) {
    console.warn(`Warning: Could not parse existing MCP config: ${error.message}`);
  }
}

// Update filesystem server config
mcpConfig.mcpServers.filesystem = {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", workspaceDir],
  type: "stdio"
};

// Update puppeteer server config with the enhanced version
mcpConfig.mcpServers.puppeteer = {
  command: "node",
  args: [enhancedPuppeteerPath],
  type: "stdio"
};

// Write updated config
debug('Writing updated MCP config to:', mcpConfigPath);
fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
log(`Updated MCP configuration at ${mcpConfigPath}`);

// Check required dependencies
try {
  debug('Checking for required dependencies');
  let missingDeps = [];
  
  try {
    require.resolve('puppeteer');
    debug('Puppeteer is installed');
  } catch (e) {
    missingDeps.push('puppeteer');
  }
  
  try {
    require.resolve('turndown');
    debug('Turndown is installed');
  } catch (e) {
    missingDeps.push('turndown');
  }
  
  try {
    require.resolve('@modelcontextprotocol/sdk');
    debug('MCP SDK is installed');
  } catch (e) {
    missingDeps.push('@modelcontextprotocol/sdk');
  }
  
  if (missingDeps.length > 0) {
    console.log(`Installing missing dependencies: ${missingDeps.join(', ')}`);
    execSync(`cd "${cursorUtilsDir}" && npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  }
} catch (error) {
  console.warn(`Warning: Error checking dependencies: ${error.message}`);
}

// Kill any existing servers
try {
  log('Stopping existing MCP servers...');
  debug('Killing any running server-filesystem processes');
  execSync('pkill -f "server-filesystem" || true', { stdio: DEBUG ? 'inherit' : 'ignore' });
  
  debug('Killing any running puppeteer-mcp-enhanced processes');
  execSync('pkill -f "puppeteer-mcp-enhanced.js" || true', { stdio: DEBUG ? 'inherit' : 'ignore' });
} catch (error) {
  debug('Error stopping servers:', error.message);
}

// Set permissions on the enhanced puppeteer script
try {
  if (fs.existsSync(enhancedPuppeteerPath)) {
    debug('Setting executable permissions on enhanced Puppeteer script');
    fs.chmodSync(enhancedPuppeteerPath, '755');
  } else {
    console.error(`Error: Enhanced Puppeteer script not found at ${enhancedPuppeteerPath}`);
    process.exit(1);
  }
} catch (error) {
  console.warn(`Warning: Could not set permissions: ${error.message}`);
}

// Function to create a timestamp for log files
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

// Create logs directory
const logsDir = path.join(cursorUtilsDir, 'logs');
if (!fs.existsSync(logsDir)) {
  debug('Creating logs directory:', logsDir);
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const timestamp = getTimestamp();
const fsLogPath = path.join(logsDir, `filesystem-${timestamp}.log`);
const puppeteerLogPath = path.join(logsDir, `puppeteer-${timestamp}.log`);

debug('Filesystem log file:', fsLogPath);
debug('Puppeteer log file:', puppeteerLogPath);

// Start the filesystem server
log(`Starting filesystem MCP server for: ${workspaceDir}`);

let stdioConfig = 'ignore';
if (DEBUG) {
  // When in debug mode, redirect outputs to log files
  fs.writeFileSync(fsLogPath, `Starting filesystem server at ${new Date().toISOString()}\n`);
  fs.writeFileSync(puppeteerLogPath, `Starting puppeteer server at ${new Date().toISOString()}\n`);
}

// Using spawn with detached mode to run in background
const fileSystemServer = spawn('npx', ['-y', '@modelcontextprotocol/server-filesystem', workspaceDir], {
  detached: true,
  stdio: 'ignore',
  env: { ...process.env, DEBUG: DEBUG ? '1' : '0' }
});

// Start the enhanced puppeteer server
log(`Starting enhanced Puppeteer MCP server`);
const puppeteerServer = spawn('node', [enhancedPuppeteerPath], {
  detached: true,
  stdio: 'ignore',
  env: { ...process.env, DEBUG: DEBUG ? '1' : '0' }
});

// Unref the children to allow the parent to exit
fileSystemServer.unref();
puppeteerServer.unref();

// Save process IDs for easier debugging
if (DEBUG) {
  fs.appendFileSync(fsLogPath, `Process ID: ${fileSystemServer.pid}\n`);
  fs.appendFileSync(puppeteerLogPath, `Process ID: ${puppeteerServer.pid}\n`);
  
  try {
    // Save PIDs to a file for easier checking later
    const pidFile = path.join(logsDir, 'mcp-servers.pid');
    fs.writeFileSync(pidFile, `filesystem:${fileSystemServer.pid}\npuppeteer:${puppeteerServer.pid}\n`);
    debug(`PIDs saved to ${pidFile}`);
  } catch (error) {
    debug('Error saving PIDs:', error.message);
  }
}

log('MCP servers started successfully in the background.');
if (DEBUG) {
  log(`Log files:
- Filesystem: ${fsLogPath}
- Puppeteer: ${puppeteerLogPath}`);
}

log('\nAvailable MCP Servers:');
log('- filesystem: Access to files and directories');
log('- puppeteer: Browser automation with HTML to Markdown conversion');
log('\nTo enable debug output, run with:');
log('DEBUG=1 node scripts/start-filesystem-mcp.js');
log('\nYou can now restart Cursor IDE to use the MCP servers.'); 