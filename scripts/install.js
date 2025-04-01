#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Define paths
const homeDir = os.homedir();
const cursorConfigDir = path.join(homeDir, '.cursor');
const startupScriptsDir = path.join(cursorConfigDir, 'startup-scripts');
const mcpScriptName = 'cursor-mcp-init.js';
const mcpScriptDestPath = path.join(startupScriptsDir, mcpScriptName);
const currentDir = path.dirname(__dirname);
const sourceMcpScriptPath = path.join(currentDir, 'scripts', 'cursor-mcp-init.js');
const mcpConfigPath = path.join(cursorConfigDir, 'mcp.json');

// Create cursor startup scripts directory if it doesn't exist
console.log('Setting up Cursor MCP utilities...');

if (!fs.existsSync(cursorConfigDir)) {
  console.log(`Creating Cursor config directory: ${cursorConfigDir}`);
  fs.mkdirSync(cursorConfigDir, { recursive: true });
}

if (!fs.existsSync(startupScriptsDir)) {
  console.log(`Creating Cursor startup scripts directory: ${startupScriptsDir}`);
  fs.mkdirSync(startupScriptsDir, { recursive: true });
}

// Copy the MCP script to the cursor startup scripts directory
try {
  // Copy the MCP initialization script
  fs.copyFileSync(sourceMcpScriptPath, mcpScriptDestPath);
  fs.chmodSync(mcpScriptDestPath, '755'); // Make executable
  console.log(`MCP script installed to: ${mcpScriptDestPath}`);

  // Copy only the standalone UI analyzer script
  const standaloneScriptPath = path.join(currentDir, 'scripts', 'standalone-ui-analyzer.js');
  const standaloneDestPath = path.join(startupScriptsDir, 'standalone-ui-analyzer.js');
  
  if (fs.existsSync(standaloneScriptPath)) {
    fs.copyFileSync(standaloneScriptPath, standaloneDestPath);
    fs.chmodSync(standaloneDestPath, '755'); // Make executable
    console.log(`Standalone UI analyzer installed to: ${standaloneDestPath}`);
  } else {
    console.log(`Warning: Standalone UI analyzer not found: ${standaloneScriptPath}`);
  }

  // Create launcher script
  const mcpLauncherPath = path.join(startupScriptsDir, 'mcp-launcher.sh');
  const mcpLauncherContent = `#!/bin/bash
node "${mcpScriptDestPath}" "$@"
`;
  fs.writeFileSync(mcpLauncherPath, mcpLauncherContent);
  fs.chmodSync(mcpLauncherPath, '755'); // Make executable
  console.log(`MCP launcher script created at: ${mcpLauncherPath}`);

  // Update MCP configuration
  let mcpConfig = {};
  if (fs.existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    } catch (error) {
      console.warn(`Warning: Could not parse existing MCP config, creating new one: ${error.message}`);
      mcpConfig = { mcpServers: {} };
    }
  } else {
    mcpConfig = { mcpServers: {} };
  }

  // Add servers to MCP config if not present
  if (!mcpConfig.mcpServers) {
    mcpConfig.mcpServers = {};
  }

  // Configure MCP servers with appropriate settings
  const mcpServers = {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", `${homeDir}/Desktop/Work/*`],
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
    }
  };

  // Add each server to the config
  Object.entries(mcpServers).forEach(([key, config]) => {
    mcpConfig.mcpServers[key] = config;
  });

  // Write updated config
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`Updated MCP configuration at: ${mcpConfigPath}`);

  // Create global symlinks for easy access from anywhere
  try {
    const globalBinDir = '/usr/local/bin';
    const mcpSymlinkPath = path.join(globalBinDir, 'cursor-mcp');
    const uiAnalyzerSymlinkPath = path.join(globalBinDir, 'ui-analyzer');
    
    if (fs.existsSync(mcpSymlinkPath)) {
      fs.unlinkSync(mcpSymlinkPath);
    }
    
    if (fs.existsSync(uiAnalyzerSymlinkPath)) {
      fs.unlinkSync(uiAnalyzerSymlinkPath);
    }
    
    fs.symlinkSync(mcpScriptDestPath, mcpSymlinkPath);
    fs.chmodSync(mcpSymlinkPath, '755');
    console.log(`Created global symlink at ${mcpSymlinkPath}`);

    if (fs.existsSync(standaloneDestPath)) {
      fs.symlinkSync(standaloneDestPath, uiAnalyzerSymlinkPath);
      fs.chmodSync(uiAnalyzerSymlinkPath, '755');
      console.log(`Created global symlink at ${uiAnalyzerSymlinkPath}`);
    }
  } catch (linkError) {
    console.log(`Note: Could not create global symlinks. Run with sudo if you want this feature.`);
  }

  console.log('\nSetup complete! The MCP utilities are now installed.');
  console.log('\nAvailable MCP Servers:');
  console.log('- filesystem: Access to files and directories');
  console.log('- puppeteer: Browser automation and UI analysis');
  console.log('- github: GitHub repository integration');
  console.log('- webresearch: Web search and content retrieval');
  console.log('- fetch: Enhanced fetch capabilities');
  console.log('- sequentialthinking: Sequential thinking for complex tasks');
  
  console.log('\nTo manually start the MCP server, run:');
  console.log(`node ${mcpScriptDestPath}`);
  console.log('or simply:');
  console.log('cursor-mcp (if symlink was created successfully)');

  console.log('\nTo use the UI analyzer standalone:');
  console.log('ui-analyzer https://example.com (if symlink was created successfully)');
  console.log('or:');
  console.log('node scripts/standalone-ui-analyzer.js https://example.com');

} catch (error) {
  console.error('Error installing scripts:', error.message);
  process.exit(1);
}
