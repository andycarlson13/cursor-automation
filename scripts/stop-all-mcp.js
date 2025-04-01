#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Main function
async function main() {
  console.log('Stopping all MCP servers...');
  
  // Check if we have PID file
  const pidFilePath = path.join(process.cwd(), 'mcp-pids.json');
  let stoppedByPidFile = false;
  
  if (fs.existsSync(pidFilePath)) {
    try {
      const pids = JSON.parse(fs.readFileSync(pidFilePath, 'utf8'));
      
      // Kill each process
      for (const { name, pid } of pids) {
        try {
          console.log(`Stopping ${name} MCP server (PID: ${pid})...`);
          
          if (process.platform === 'win32') {
            execSync(`taskkill /F /PID ${pid}`);
          } else {
            execSync(`kill -9 ${pid}`);
          }
          
          console.log(`${name} MCP server stopped.`);
          stoppedByPidFile = true;
        } catch (err) {
          console.log(`${name} MCP server was already stopped or not found.`);
        }
      }
      
      // Remove PID file
      fs.unlinkSync(pidFilePath);
      
    } catch (err) {
      console.error('Error reading PID file:', err);
    }
  }
  
  // Additional safety check - try to find and kill all MCP processes
  try {
    console.log('Checking for any remaining MCP processes...');
    
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq *mcp*"', { stdio: 'ignore' });
    } else {
      // More comprehensive search for MCP processes
      const processPatterns = [
        'server-filesystem',
        'server-puppeteer',
        'server-github',
        'mcp-webresearch',
        'mcprouter'
      ];
      
      for (const pattern of processPatterns) {
        try {
          const output = execSync(`ps aux | grep ${pattern} | grep -v grep`).toString();
          
          if (output.trim()) {
            console.log(`Found ${pattern} processes, stopping...`);
            execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' });
          }
        } catch (e) {
          // No matching processes found, continue
        }
      }
    }
  } catch (err) {
    // Ignore errors from pkill if no processes match
  }
  
  // Check for any MCP log directory and create a backup
  const logDir = path.join(process.cwd(), 'mcp-logs');
  if (fs.existsSync(logDir)) {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupDir = path.join(process.cwd(), `mcp-logs-backup-${timestamp}`);
      
      // Create backup directory
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Copy log files to backup
      const logFiles = fs.readdirSync(logDir);
      for (const file of logFiles) {
        const srcPath = path.join(logDir, file);
        const destPath = path.join(backupDir, file);
        fs.copyFileSync(srcPath, destPath);
      }
      
      console.log(`Log files backed up to ${backupDir}`);
      
      // Clear log directory
      for (const file of logFiles) {
        const filePath = path.join(logDir, file);
        fs.writeFileSync(filePath, '');
      }
      
      console.log('Log files cleared');
    } catch (err) {
      console.error('Error handling log files:', err);
    }
  }
  
  console.log('All MCP servers stopped.');
}

// Run main function
main().catch(err => {
  console.error('Error stopping MCP servers:', err);
  process.exit(1);
}); 