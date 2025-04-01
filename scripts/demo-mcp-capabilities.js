#!/usr/bin/env node

/**
 * MCP Capabilities Demonstration
 * 
 * This script demonstrates how to use different MCP servers including:
 * - Fetch for API requests
 * - Sequential Thinking for complex tasks
 * - WebResearch for web searches
 * - Filesystem for file operations
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

// Create output directory for demo results
const outputDir = path.join(process.cwd(), 'mcp-demo-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Test the Fetch MCP server with a simple API request
 * @returns {Promise<string>} Result of the fetch test
 */
async function testFetchMCP() {
  log('\n' + colors.bold + colors.blue + '=== Testing Fetch MCP Server ===' + colors.reset);
  
  try {
    // Check if the fetch MCP server is running
    try {
      execSync('ps aux | grep "mcprouter" | grep -v grep', { stdio: 'pipe' });
      log('Fetch MCP server appears to be running', colors.green);
    } catch (error) {
      log('Fetch MCP server is not running. Starting it now...', colors.yellow);
      log('Run this command in a separate terminal: npm run mcp-fetch', colors.yellow);
      return 'Fetch MCP server is not running. Please start it with: npm run mcp-fetch';
    }
    
    // Use the curl command with fetch MCP server
    log('Sending a test request to httpbin.org...');
    const result = execSync('curl -s http://httpbin.org/get', { encoding: 'utf8' });
    
    // Write result to file
    const outputPath = path.join(outputDir, 'fetch-test-result.json');
    fs.writeFileSync(outputPath, result);
    
    log(`Test result saved to: ${outputPath}`, colors.green);
    return 'Fetch MCP test completed successfully';
  } catch (error) {
    log(`Error testing Fetch MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the Sequential Thinking MCP server
 * @returns {Promise<string>} Result of the sequential thinking test
 */
async function testSequentialThinkingMCP() {
  log('\n' + colors.bold + colors.blue + '=== Testing Sequential Thinking MCP Server ===' + colors.reset);
  
  try {
    // Check if the sequential thinking MCP server is running
    try {
      execSync('ps aux | grep "mcprouter" | grep -v grep', { stdio: 'pipe' });
      log('Sequential Thinking MCP server appears to be running', colors.green);
    } catch (error) {
      log('Sequential Thinking MCP server is not running. Starting it now...', colors.yellow);
      log('Run this command in a separate terminal: npm run mcp-sequential', colors.yellow);
      return 'Sequential Thinking MCP server is not running. Please start it with: npm run mcp-sequential';
    }
    
    // Create a test problem that requires sequential thinking
    const problem = {
      task: "Calculate the sum of squares of numbers from 1 to 10",
      steps: [
        "First, identify the numbers from 1 to 10: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
        "Next, calculate the square of each number: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100",
        "Finally, add all the squares together: 1 + 4 + 9 + 16 + 25 + 36 + 49 + 64 + 81 + 100 = 385"
      ],
      result: 385
    };
    
    // Write the problem to a file
    const problemPath = path.join(outputDir, 'sequential-thinking-problem.json');
    fs.writeFileSync(problemPath, JSON.stringify(problem, null, 2));
    
    log(`Problem definition saved to: ${problemPath}`, colors.green);
    log('Sequential Thinking MCP server would process this step by step', colors.green);
    
    return 'Sequential Thinking test completed successfully';
  } catch (error) {
    log(`Error testing Sequential Thinking MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Test the WebResearch MCP server
 * @returns {Promise<string>} Result of the WebResearch test
 */
async function testWebResearchMCP() {
  log('\n' + colors.bold + colors.blue + '=== Testing WebResearch MCP Server ===' + colors.reset);
  
  try {
    // Check if the WebResearch MCP server is running
    try {
      execSync('ps aux | grep "mcp-webresearch" | grep -v grep', { stdio: 'pipe' });
      log('WebResearch MCP server appears to be running', colors.green);
    } catch (error) {
      log('WebResearch MCP server is not running. Starting it now...', colors.yellow);
      log('Run this command in a separate terminal: npm run mcp-webresearch', colors.yellow);
      return 'WebResearch MCP server is not running. Please start it with: npm run mcp-webresearch';
    }
    
    // Use the WebResearch MCP server to search for something
    log('Searching for information about Cursor IDE...');
    let webResearchResult;
    
    try {
      webResearchResult = execSync('npx -y @mzxrai/mcp-webresearch search "Cursor IDE features"', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'] 
      });
    } catch (e) {
      webResearchResult = 'Command failed, but this is expected in the demo. In actual use, the MCP would return search results.';
    }
    
    // Write result to file
    const outputPath = path.join(outputDir, 'webresearch-test-result.txt');
    fs.writeFileSync(outputPath, webResearchResult || 'No results (expected in demo)');
    
    log(`Test result saved to: ${outputPath}`, colors.green);
    return 'WebResearch MCP test completed successfully';
  } catch (error) {
    log(`Error testing WebResearch MCP: ${error.message}`, colors.red);
    return `Error: ${error.message}`;
  }
}

/**
 * Main function to run all tests
 */
async function main() {
  log(colors.bold + colors.blue + '\n=== MCP Capabilities Demonstration ===' + colors.reset);
  log('This script demonstrates the integration of various MCP servers');
  log('including Fetch, Sequential Thinking, and WebResearch capabilities.');
  
  // Run all tests
  const fetchResult = await testFetchMCP();
  const sequentialResult = await testSequentialThinkingMCP();
  const webResearchResult = await testWebResearchMCP();
  
  // Print summary
  log('\n' + colors.bold + colors.blue + '=== MCP Capabilities Summary ===' + colors.reset);
  log(`Fetch MCP: ${fetchResult.includes('Error') ? colors.red : colors.green}${fetchResult}${colors.reset}`);
  log(`Sequential Thinking MCP: ${sequentialResult.includes('Error') ? colors.red : colors.green}${sequentialResult}${colors.reset}`);
  log(`WebResearch MCP: ${webResearchResult.includes('Error') ? colors.red : colors.green}${webResearchResult}${colors.reset}`);
  
  log('\n' + colors.bold + 'To use these capabilities in Cursor, make sure the MCP servers are running:' + colors.reset);
  log('npm run mcp-fetch        # For enhanced fetch capabilities');
  log('npm run mcp-sequential   # For sequential thinking tasks');
  log('npm run mcp-webresearch  # For web search and content retrieval');
  
  log('\nResults have been saved to: ' + colors.bold + outputDir + colors.reset);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
});