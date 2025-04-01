#!/usr/bin/env node

/**
 * Test Script for Cursor Utils Installation
 * 
 * This script verifies that all components of the Cursor Utils toolkit
 * are installed and functioning correctly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function checkmark(success) {
  return success ? colors.green + '✓' + colors.reset : colors.red + '✗' + colors.reset;
}

// Header
log('\n' + colors.bold + colors.blue + '=== Cursor Utils Installation Test ===' + colors.reset + '\n');

// Check required directories
log(colors.bold + '1. Checking required directories:' + colors.reset);
const requiredDirs = ['scripts', 'mcp-test-results'];
let allDirsExist = true;

for (const dir of requiredDirs) {
  const dirPath = path.join(process.cwd(), dir);
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  
  log(`   ${checkmark(exists)} ${dir}`);
  
  if (!exists) {
    allDirsExist = false;
    fs.mkdirSync(dirPath, { recursive: true });
    log(`     → Created missing directory: ${dir}`, colors.yellow);
  }
}

// Check required files
log('\n' + colors.bold + '2. Checking required files:' + colors.reset);
const requiredFiles = [
  'scripts/cursor-mcp-init.js',
  'scripts/test-all-mcp-tools.js',
  'scripts/demo-mcp-capabilities.js',
  'README.md',
  'package.json'
];
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  
  log(`   ${checkmark(exists)} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  }
}

// Check dependencies
log('\n' + colors.bold + '3. Checking dependencies:' + colors.reset);
const dependencies = ['puppeteer', '@mzxrai/mcp-webresearch', '@modelcontextprotocol/sdk', 'mcprouter'];
let allDepsInstalled = true;

for (const dep of dependencies) {
  let installed = false;
  
  try {
    // Try to require the dependency
    require.resolve(dep);
    installed = true;
  } catch (error) {
    installed = false;
  }
  
  log(`   ${checkmark(installed)} ${dep}`);
  
  if (!installed) {
    allDepsInstalled = false;
  }
}

// Check MCP configuration
log('\n' + colors.bold + '4. Checking MCP configuration:' + colors.reset);
const homeDir = process.env.HOME || process.env.USERPROFILE;
const mcpConfigPath = path.join(homeDir, '.cursor', 'mcp.json');
let mcpConfigOk = false;

try {
  const mcpConfig = fs.existsSync(mcpConfigPath) ? 
    JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8')) : 
    { mcpServers: {} };
  
  const requiredServers = ['filesystem', 'webresearch', 'github', 'fetch', 'sequentialthinking', 'puppeteer'];
  const configuredServers = Object.keys(mcpConfig.mcpServers || {});
  
  const missingServers = requiredServers.filter(server => !configuredServers.includes(server));
  
  if (missingServers.length === 0) {
    mcpConfigOk = true;
    log(`   ${checkmark(true)} MCP configuration found with all required servers`);
  } else {
    log(`   ${checkmark(false)} Missing MCP servers: ${missingServers.join(', ')}`);
    log('     → Run the initialization script to fix this: npm run mcp-init', colors.yellow);
  }
} catch (error) {
  log(`   ${checkmark(false)} Error checking MCP configuration: ${error.message}`);
  log('     → Run the initialization script to fix this: npm run mcp-init', colors.yellow);
}

// Test MCP tools
log('\n' + colors.bold + '5. Testing MCP Tools:' + colors.reset);
let mcpToolsOk = false;

try {
  // Just check if servers are running
  const filesystemRunning = execSync('ps aux | grep "server-filesystem" | grep -v grep', { stdio: 'pipe' }).toString().trim().length > 0;
  const puppeteerRunning = execSync('ps aux | grep "server-puppeteer" | grep -v grep', { stdio: 'pipe' }).toString().trim().length > 0;
  const webresearchRunning = execSync('ps aux | grep "mcp-webresearch" | grep -v grep', { stdio: 'pipe' }).toString().trim().length > 0;
  const githubRunning = execSync('ps aux | grep "server-github" | grep -v grep', { stdio: 'pipe' }).toString().trim().length > 0;
  const mcrouterRunning = execSync('ps aux | grep "mcprouter" | grep -v grep', { stdio: 'pipe' }).toString().trim().length > 0;
  
  log(`   ${checkmark(filesystemRunning)} Filesystem MCP server is ${filesystemRunning ? 'running' : 'not running'}`);
  log(`   ${checkmark(puppeteerRunning)} Puppeteer MCP server is ${puppeteerRunning ? 'running' : 'not running'}`);
  log(`   ${checkmark(webresearchRunning)} WebResearch MCP server is ${webresearchRunning ? 'running' : 'not running'}`);
  log(`   ${checkmark(githubRunning)} GitHub MCP server is ${githubRunning ? 'running' : 'not running'}`);
  log(`   ${checkmark(mcrouterRunning)} MCRouter is ${mcrouterRunning ? 'running' : 'not running'}`);
  
  if (!filesystemRunning || !webresearchRunning || !githubRunning || !mcrouterRunning || !puppeteerRunning) {
    log('     → Run MCP initialization to start all servers: npm run mcp-init', colors.yellow);
  } else {
    mcpToolsOk = true;
  }
} catch (error) {
  log(`   ${checkmark(false)} Error checking MCP tools: ${error.message}`);
  log('     → Run MCP initialization to start all servers: npm run mcp-init', colors.yellow);
}

// Summary
log('\n' + colors.bold + '=== Test Summary ===' + colors.reset);
log(`Directories: ${checkmark(allDirsExist)}`);
log(`Required Files: ${checkmark(allFilesExist)}`);
log(`Dependencies: ${checkmark(allDepsInstalled)}`);
log(`MCP Configuration: ${checkmark(mcpConfigOk)}`);
log(`MCP Tools: ${checkmark(mcpToolsOk)}`);

const overallSuccess = allDirsExist && allFilesExist && allDepsInstalled && mcpConfigOk && mcpToolsOk;

if (overallSuccess) {
  log('\n' + colors.bold + colors.green + 'All tests passed! Cursor MCP utilities are ready to use.' + colors.reset);
} else {
  log('\n' + colors.bold + colors.yellow + 'Some tests failed. Run the initialization script to fix issues:' + colors.reset);
  log('npm run mcp-init');
}

log('\n');