#!/usr/bin/env node

/**
 * Script to run the GitHub MCP server with proper token handling
 * This allows the server to work with either GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check for token in environment variables
const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

// If no token is found in environment, check .env file
if (!githubToken) {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for GITHUB_TOKEN
    const tokenMatch = envContent.match(/GITHUB_TOKEN=["']?([^"'\n]+)["']?/);
    if (tokenMatch && tokenMatch[1]) {
      process.env.GITHUB_TOKEN = tokenMatch[1];
    }
    
    // Check for GITHUB_PERSONAL_ACCESS_TOKEN if GITHUB_TOKEN wasn't found
    if (!process.env.GITHUB_TOKEN) {
      const patMatch = envContent.match(/GITHUB_PERSONAL_ACCESS_TOKEN=["']?([^"'\n]+)["']?/);
      if (patMatch && patMatch[1]) {
        process.env.GITHUB_PERSONAL_ACCESS_TOKEN = patMatch[1];
      }
    }
  }
}

// Check if we have a token now
if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  console.error("GitHub token not found in environment variables or .env file.");
  console.error("Please run 'npm run setup-github' to set up your GitHub token.");
  process.exit(1);
}

// Run the GitHub MCP server with the environment we've set up
const githubServer = spawn('npx', ['-y', '@modelcontextprotocol/server-github'], {
  stdio: 'inherit',
  env: process.env
});

githubServer.on('error', (error) => {
  console.error('Failed to start GitHub MCP server:', error.message);
  process.exit(1);
});

githubServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`GitHub MCP server exited with code ${code}`);
    process.exit(code);
  }
}); 