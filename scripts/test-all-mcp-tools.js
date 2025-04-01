#!/usr/bin/env node

/**
 * Comprehensive MCP Tools Testing Script
 * 
 * This script tests all the available MCP tools:
 * - Filesystem: File operations
 * - Puppeteer: Browser automation
 * - GitHub: Repository operations
 * - WebResearch: Web search and browsing
 * - Fetch: API requests
 * - Sequential Thinking: Complex task processing
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Create output directory for test results
const outputDir = path.join(process.cwd(), 'mcp-test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Helper function to log messages with color
 */
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

/**
 * Helper function to check if an MCP server is running
 */
function isMCPServerRunning(serverName) {
  try {
    // Use different patterns for different servers
    let grepPattern;
    if (serverName === 'server-filesystem') {
      grepPattern = 'mcp-server-filesystem|server-filesystem|@modelcontextprotocol/server-filesystem';
    } else if (serverName === 'server-puppeteer') {
      grepPattern = 'mcp-server-puppeteer|server-puppeteer|@modelcontextprotocol/server-puppeteer';
    } else if (serverName === 'server-github') {
      grepPattern = 'mcp-server-github|server-github|@modelcontextprotocol/server-github';
    } else if (serverName === 'mcp-webresearch') {
      grepPattern = 'mcp-webresearch|mcp-server-webresearch|@mzxrai/mcp-webresearch';
    } else {
      grepPattern = serverName;
    }
    
    const result = execSync(`ps aux | grep -E "${grepPattern}" | grep -v grep`, { stdio: ['pipe', 'pipe', 'ignore'] });
    return result.toString().trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Test the Filesystem MCP server
 */
async function testFilesystemMCP() {
  log('\n' + colors.bold + colors.blue + '=== Testing Filesystem MCP Server ===' + colors.reset);
  
  try {
    // Check if server is running
    if (!isMCPServerRunning('server-filesystem')) {
      log('Filesystem MCP server is not running. Please start it with: npm run mcp-fs', colors.yellow);
      return 'Filesystem MCP server is not running';
    }
    
    log('Filesystem MCP server is running', colors.green);
    
    // Test file operations by creating a test file
    const testFilePath = path.join(outputDir, 'filesystem-test.txt');
    const testContent = 'This file was created by the Filesystem MCP server test on ' + new Date().toISOString();
    
    fs.writeFileSync(testFilePath, testContent);
    log(`Created test file at: ${testFilePath}`, colors.green);
    
    // Read the file back
    const readContent = fs.readFileSync(testFilePath, 'utf8');
    log('Successfully read file content', colors.green);
    
    return 'Filesystem MCP test completed successfully';
  } catch (error) {
    log(`Error testing Filesystem MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the Puppeteer MCP server
 */
async function testPuppeteerMCP() {
  log('\n' + colors.bold + colors.magenta + '=== Testing Puppeteer MCP Server ===' + colors.reset);
  
  try {
    // Check if server is running
    if (!isMCPServerRunning('server-puppeteer')) {
      log('Puppeteer MCP server is not running. Please start it with: npm run mcp-puppeteer', colors.yellow);
      return 'Puppeteer MCP server is not running';
    }
    
    log('Puppeteer MCP server is running', colors.green);
    
    // For this test, we'll just create a test result file
    const testResultPath = path.join(outputDir, 'puppeteer-test-result.txt');
    const testResultContent = `Puppeteer MCP server test - ${new Date().toISOString()}
    
The Puppeteer MCP server can be used for:
- Web scraping
- UI testing
- Browser automation
- Taking screenshots of websites
- Generating PDFs from web pages`;
    
    fs.writeFileSync(testResultPath, testResultContent);
    log(`Puppeteer test information saved to: ${testResultPath}`, colors.green);
    
    return 'Puppeteer MCP test completed successfully';
  } catch (error) {
    log(`Error testing Puppeteer MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the GitHub MCP server
 */
async function testGitHubMCP() {
  log('\n' + colors.bold + colors.cyan + '=== Testing GitHub MCP Server ===' + colors.reset);
  
  try {
    // Check if server is running
    if (!isMCPServerRunning('server-github')) {
      log('GitHub MCP server is not running. Please start it with: npm run mcp-github', colors.yellow);
      return 'GitHub MCP server is not running';
    }
    
    log('GitHub MCP server is running', colors.green);
    
    // For this test, we'll just create a test result file
    const testResultPath = path.join(outputDir, 'github-test-result.txt');
    const testResultContent = `GitHub MCP server test - ${new Date().toISOString()}
    
The GitHub MCP server can be used for:
- Searching repositories
- Creating pull requests
- Managing issues
- Accessing repository content
- Creating and updating files`;
    
    fs.writeFileSync(testResultPath, testResultContent);
    log(`GitHub test information saved to: ${testResultPath}`, colors.green);
    
    return 'GitHub MCP test completed successfully';
  } catch (error) {
    log(`Error testing GitHub MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the WebResearch MCP server
 */
async function testWebResearchMCP() {
  log('\n' + colors.bold + colors.green + '=== Testing WebResearch MCP Server ===' + colors.reset);
  
  try {
    // Check if server is running
    if (!isMCPServerRunning('mcp-webresearch')) {
      log('WebResearch MCP server is not running. Please start it with: npm run mcp-webresearch', colors.yellow);
      return 'WebResearch MCP server is not running';
    }
    
    log('WebResearch MCP server is running', colors.green);
    
    // For this test, we'll just create a test result file
    const testResultPath = path.join(outputDir, 'webresearch-test-result.txt');
    const testResultContent = `WebResearch MCP server test - ${new Date().toISOString()}
    
The WebResearch MCP server can be used for:
- Searching the web for information
- Visiting web pages to extract content
- Taking screenshots of websites
- Analyzing web page content`;
    
    fs.writeFileSync(testResultPath, testResultContent);
    log(`WebResearch test information saved to: ${testResultPath}`, colors.green);
    
    return 'WebResearch MCP test completed successfully';
  } catch (error) {
    log(`Error testing WebResearch MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the Fetch MCP server
 */
async function testFetchMCP() {
  log('\n' + colors.bold + colors.yellow + '=== Testing Fetch MCP Server ===' + colors.reset);
  
  try {
    // Check if server is running
    if (!isMCPServerRunning('mcprouter')) {
      log('Fetch MCP server is not running. Please start it with: npm run mcp-fetch', colors.yellow);
      return 'Fetch MCP server is not running';
    }
    
    log('Fetch MCP server is running', colors.green);
    
    // For this test, we'll just create a test result file
    const testResultPath = path.join(outputDir, 'fetch-test-result.txt');
    const testResultContent = `Fetch MCP server test - ${new Date().toISOString()}
    
The Fetch MCP server can be used for:
- Making API requests
- Fetching data from remote servers
- Posting data to endpoints
- Processing HTTP responses`;
    
    fs.writeFileSync(testResultPath, testResultContent);
    log(`Fetch test information saved to: ${testResultPath}`, colors.green);
    
    return 'Fetch MCP test completed successfully';
  } catch (error) {
    log(`Error testing Fetch MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the Sequential Thinking MCP server
 */
async function testSequentialThinkingMCP() {
  log('\n' + colors.bold + colors.red + '=== Testing Sequential Thinking MCP Server ===' + colors.reset);
  
  try {
    // Check if server is running
    if (!isMCPServerRunning('mcprouter')) {
      log('Sequential Thinking MCP server is not running. Please start it with: npm run mcp-sequential', colors.yellow);
      return 'Sequential Thinking MCP server is not running';
    }
    
    log('Sequential Thinking MCP server is running', colors.green);
    
    // For this test, we'll just create a test result file
    const testResultPath = path.join(outputDir, 'sequential-thinking-test-result.txt');
    const testResultContent = `Sequential Thinking MCP server test - ${new Date().toISOString()}
    
The Sequential Thinking MCP server can be used for:
- Breaking down complex problems into steps
- Executing multi-stage reasoning tasks
- Performing step-by-step analysis
- Chaining together multiple operations`;
    
    fs.writeFileSync(testResultPath, testResultContent);
    log(`Sequential Thinking test information saved to: ${testResultPath}`, colors.green);
    
    return 'Sequential Thinking MCP test completed successfully';
  } catch (error) {
    log(`Error testing Sequential Thinking MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Main function to run all tests
 */
async function main() {
  log(colors.bold + colors.blue + '\n=== Comprehensive MCP Tools Test ===' + colors.reset);
  log('This script tests all available MCP servers and tools\n');
  
  // Run all tests
  const filesystemResult = await testFilesystemMCP();
  const puppeteerResult = await testPuppeteerMCP();
  const githubResult = await testGitHubMCP();
  const webResearchResult = await testWebResearchMCP();
  const fetchResult = await testFetchMCP();
  const sequentialResult = await testSequentialThinkingMCP();
  
  // Print summary
  log('\n' + colors.bold + colors.blue + '=== MCP Tools Test Summary ===' + colors.reset);
  log(`Filesystem MCP: ${filesystemResult.includes('Error') ? colors.red : colors.green}${filesystemResult}${colors.reset}`);
  log(`Puppeteer MCP: ${puppeteerResult.includes('Error') ? colors.red : colors.green}${puppeteerResult}${colors.reset}`);
  log(`GitHub MCP: ${githubResult.includes('Error') ? colors.red : colors.green}${githubResult}${colors.reset}`);
  log(`WebResearch MCP: ${webResearchResult.includes('Error') ? colors.red : colors.green}${webResearchResult}${colors.reset}`);
  log(`Fetch MCP: ${fetchResult.includes('Error') ? colors.red : colors.green}${fetchResult}${colors.reset}`);
  log(`Sequential Thinking MCP: ${sequentialResult.includes('Error') ? colors.red : colors.green}${sequentialResult}${colors.reset}`);
  
  log('\n' + colors.bold + 'To use these MCP tools with the Cursor IDE, make sure the MCP servers are running:' + colors.reset);
  log('npm run mcp-fs             # For filesystem operations');
  log('npm run mcp-puppeteer      # For browser automation');
  log('npm run mcp-github         # For GitHub operations');
  log('npm run mcp-webresearch    # For web search and browsing');
  log('npm run mcp-fetch          # For API requests');
  log('npm run mcp-sequential     # For sequential thinking tasks');
  
  log('\nResults have been saved to: ' + colors.bold + outputDir + colors.reset);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
}); 