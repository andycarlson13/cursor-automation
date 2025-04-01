#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const outputDir = path.join(__dirname, '../markdown-output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node test-html-to-markdown.js <url> [selector]');
  console.log('Example: node test-html-to-markdown.js https://civictrace.com article');
  process.exit(1);
}

const url = args[0];
const selector = args[1] || 'body';

// Start the MCP server
console.log('Starting HTML to Markdown MCP server...');
const mcpServer = spawn('node', [path.join(__dirname, 'mcp-html-to-markdown.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let serverStarted = false;
let serverPort = null;
let serverSocket = null;

// Listen for server output
mcpServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[MCP Server]: ${output}`);
  
  // Extract the port from server output
  const portMatch = output.match(/Listening on port (\d+)/);
  if (portMatch) {
    serverPort = parseInt(portMatch[1], 10);
    serverStarted = true;
    console.log(`Server started on port ${serverPort}`);
    convertURL(url, selector);
  }
});

mcpServer.stderr.on('data', (data) => {
  console.error(`[MCP Server Error]: ${data.toString()}`);
});

// Clean up on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function cleanup() {
  console.log('Shutting down...');
  if (mcpServer) {
    mcpServer.kill();
  }
  if (serverSocket) {
    serverSocket.destroy();
  }
  process.exit(0);
}

// Function to make a JSON-RPC request to the MCP server
function jsonRpcRequest(method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });
    
    const options = {
      hostname: 'localhost',
      port: serverPort,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          if (jsonResponse.error) {
            reject(new Error(jsonResponse.error.message));
          } else {
            resolve(jsonResponse.result);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Function to convert URL to Markdown
async function convertURL(url, selector) {
  try {
    console.log(`Converting ${url} with selector "${selector}"...`);
    
    // Use the MCP server to get content
    const result = await jsonRpcRequest('mcp_html_to_markdown.get_url_content', { url, selector });
    
    if (result.error) {
      console.error('Error:', result.error);
      cleanup();
      return;
    }
    
    // Create a sanitized filename from the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname.replace(/\//g, '_');
    const filename = `${hostname}${pathname}`.replace(/[^a-z0-9_.-]/gi, '_');
    
    // Save HTML
    const htmlPath = path.join(outputDir, `${filename}.html`);
    fs.writeFileSync(htmlPath, result.html);
    console.log(`HTML saved to: ${htmlPath}`);
    
    // Save Markdown
    const mdPath = path.join(outputDir, `${filename}.md`);
    fs.writeFileSync(mdPath, result.markdown);
    console.log(`Markdown saved to: ${mdPath}`);
    
    console.log('\nConversion complete!');
    console.log(`Title: ${result.title}`);
    console.log(`HTML size: ${result.html.length} bytes`);
    console.log(`Markdown size: ${result.markdown.length} bytes`);
    
    // Ask if user wants to keep server running
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Keep server running? (y/n): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        cleanup();
      } else {
        console.log('Server still running. Press Ctrl+C to exit.');
      }
    });
    
  } catch (error) {
    console.error('Conversion error:', error.message);
    cleanup();
  }
} 