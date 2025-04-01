#!/usr/bin/env node

/**
 * AI Automation Agent
 * 
 * Handles automated Git operations for AI-generated changes,
 * including committing and pushing to the current branch.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for terminal output
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

// Helper function to log messages with color
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt yes/no questions
function promptYesNo(question) {
  return new Promise((resolve) => {
    rl.question(colors.cyan + question + ' (y/n): ' + colors.reset, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

// Function to detect Git repository
function detectGitRepo(dir = process.cwd()) {
  try {
    const gitDir = execSync('git rev-parse --show-toplevel', { cwd: dir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    
    return gitDir;
  } catch (error) {
    return null;
  }
}

// Function to get current Git branch
function getCurrentBranch(repoDir) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoDir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    return null;
  }
}

// Function to check if there are uncommitted changes
function hasUncommittedChanges(repoDir) {
  try {
    const status = execSync('git status --porcelain', { cwd: repoDir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    
    return status.length > 0;
  } catch (error) {
    return false;
  }
}

// Function to commit changes
async function commitChanges(repoDir, message = "AI-automated changes") {
  try {
    if (!hasUncommittedChanges(repoDir)) {
      log('No changes to commit.', colors.yellow);
      return false;
    }
    
    // Get list of changed files
    const changedFiles = execSync('git status --porcelain', { cwd: repoDir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split('\n')
      .map(line => line.trim().substring(3)); // Remove status indicators
    
    log('\nChanges to commit:', colors.blue);
    changedFiles.forEach(file => {
      log(`  - ${file}`, colors.reset);
    });
    
    // Confirm commit
    const confirmCommit = await promptYesNo('\nCommit these changes?');
    if (!confirmCommit) {
      log('Commit cancelled.', colors.yellow);
      return false;
    }
    
    // Add all changes
    execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
    
    // Get a better commit message if not provided
    let commitMessage = message;
    if (message === "AI-automated changes") {
      rl.question(colors.cyan + 'Enter a commit message (or press Enter for default): ' + colors.reset, (answer) => {
        commitMessage = answer.trim() || "AI-automated changes";
        
        // Commit changes
        execSync(`git commit -m "${commitMessage}"`, { cwd: repoDir, stdio: 'inherit' });
        log('Changes committed successfully.', colors.green);
        
        return true;
      });
    } else {
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { cwd: repoDir, stdio: 'inherit' });
      log('Changes committed successfully.', colors.green);
      
      return true;
    }
  } catch (error) {
    log(`Error committing changes: ${error.message}`, colors.red);
    return false;
  }
}

// Function to push changes
async function pushChanges(repoDir, branch) {
  try {
    // Check if remote exists
    const remotes = execSync('git remote', { cwd: repoDir, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    
    if (!remotes.includes('origin')) {
      log('No remote repository found.', colors.yellow);
      return false;
    }
    
    // Confirm push
    const confirmPush = await promptYesNo(`Push changes to ${branch}?`);
    if (!confirmPush) {
      log('Push cancelled.', colors.yellow);
      return false;
    }
    
    // Push changes
    execSync(`git push origin ${branch}`, { cwd: repoDir, stdio: 'inherit' });
    log(`Changes pushed to ${branch} successfully.`, colors.green);
    
    return true;
  } catch (error) {
    log(`Error pushing changes: ${error.message}`, colors.red);
    return false;
  }
}

// Function to take screenshots for UI changes
async function takeScreenshots(repoDir) {
  try {
    // Check if puppeteer is available
    try {
      execSync('npx -y @modelcontextprotocol/server-puppeteer --version', { stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (error) {
      log('Puppeteer MCP server not available for screenshots.', colors.yellow);
      return false;
    }
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(repoDir, 'ui-analysis-results');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Look for HTML files or typical entry points
    const possibleEntryPoints = [
      'index.html',
      'public/index.html',
      'src/index.html',
      'dist/index.html'
    ];
    
    let entryPoint = null;
    for (const file of possibleEntryPoints) {
      const filePath = path.join(repoDir, file);
      if (fs.existsSync(filePath)) {
        entryPoint = filePath;
        break;
      }
    }
    
    if (!entryPoint) {
      log('No HTML entry point found for screenshots.', colors.yellow);
      return false;
    }
    
    // Take screenshot using puppeteer
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(screenshotsDir, `ui-snapshot-${timestamp}.png`);
    
    // We'll use a simple puppeteer script
    const puppeteerScript = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        const browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto('file://${entryPoint.replace(/\\/g, '\\\\')}', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: '${outputPath.replace(/\\/g, '\\\\')}', fullPage: true });
        await browser.close();
      })();
    `;
    
    // Save script to temp file and execute
    const tempScriptPath = path.join(os.tmpdir(), 'puppeteer-script.js');
    fs.writeFileSync(tempScriptPath, puppeteerScript);
    
    log('Taking UI screenshot...', colors.blue);
    execSync(`node "${tempScriptPath}"`, { stdio: 'inherit' });
    
    // Clean up temp file
    fs.unlinkSync(tempScriptPath);
    
    log(`Screenshot saved to: ${outputPath}`, colors.green);
    return true;
  } catch (error) {
    log(`Error taking screenshots: ${error.message}`, colors.red);
    return false;
  }
}

// Main function to handle automation
async function main() {
  try {
    log(colors.bold + colors.magenta + '=== AI Automation Agent ===' + colors.reset);
    
    // Detect Git repository
    const repoDir = detectGitRepo();
    if (!repoDir) {
      log('No Git repository found in the current directory.', colors.yellow);
      rl.close();
      return;
    }
    
    // Get current branch
    const currentBranch = getCurrentBranch(repoDir);
    if (!currentBranch) {
      log('Could not determine current Git branch.', colors.yellow);
      rl.close();
      return;
    }
    
    log(`Repository: ${path.basename(repoDir)}`, colors.blue);
    log(`Current branch: ${currentBranch}`, colors.blue);
    
    // Check for uncommitted changes
    if (hasUncommittedChanges(repoDir)) {
      log('Uncommitted changes detected.', colors.yellow);
      
      // Option to take screenshots of UI changes
      const takeScreenshot = await promptYesNo('Take screenshot of UI changes?');
      if (takeScreenshot) {
        await takeScreenshots(repoDir);
      }
      
      // Commit changes
      const committed = await commitChanges(repoDir);
      
      // Push changes if committed
      if (committed) {
        await pushChanges(repoDir, currentBranch);
      }
    } else {
      log('No uncommitted changes detected.', colors.green);
    }
    
    log('\n' + colors.bold + colors.green + '=== AI Automation Complete ===' + colors.reset);
    rl.close();
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});