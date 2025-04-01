#!/usr/bin/env node

/**
 * Standalone UI Analyzer Example
 * 
 * This example shows how to use the standalone UI analyzer in any project.
 * Usage: node standalone-example.js <url>
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Process command line arguments
const url = process.argv[2];
if (!url) {
  console.log('Usage: node standalone-example.js <url>');
  process.exit(1);
}

// Setup directories
const RESULTS_DIR = path.join(process.cwd(), 'ui-analysis-results');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Simple function to take a screenshot of a webpage
async function captureScreenshot(url) {
  console.log(`Capturing screenshot of ${url}...`);
  
  let browser = null;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    // Create new page
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({
      width: 1280,
      height: 800
    });
    
    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take screenshot
    const timestamp = Date.now();
    const screenshotPath = path.join(RESULTS_DIR, `screenshot-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null;
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
    }
  }
}

// Simple function to check basic accessibility issues
async function checkAccessibility(url) {
  console.log(`Checking accessibility of ${url}...`);
  
  let browser = null;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    // Create new page
    const page = await browser.newPage();
    
    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Basic accessibility checks using page.evaluate
    const results = await page.evaluate(() => {
      const issues = [];
      
      // Check for images without alt text
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('alt')) {
          issues.push(`Image missing alt text: ${img.src.substring(0, 100)}`);
        }
      });
      
      // Check for empty links
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        if (!link.textContent.trim() && !link.hasAttribute('aria-label')) {
          issues.push(`Empty link without label: ${link.href}`);
        }
      });
      
      // Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1));
        if (level - lastLevel > 1 && lastLevel !== 0) {
          issues.push(`Heading level skipped from h${lastLevel} to h${level}`);
        }
        lastLevel = level;
      });
      
      return issues;
    });
    
    // Save results to file
    const timestamp = Date.now();
    const reportPath = path.join(RESULTS_DIR, `accessibility-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`Found ${results.length} accessibility issues.`);
    console.log(`Report saved to: ${reportPath}`);
    
    return results;
  } catch (error) {
    console.error('Error checking accessibility:', error);
    return [];
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
    }
  }
}

// Simple function to generate a basic report
function generateReport(url, screenshotPath, accessibilityIssues) {
  const timestamp = Date.now();
  const reportPath = path.join(RESULTS_DIR, `report-${timestamp}.json`);
  
  const report = {
    url,
    timestamp: new Date().toISOString(),
    screenshot: screenshotPath,
    accessibilityIssues: accessibilityIssues,
    summary: {
      totalIssues: accessibilityIssues.length
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);
  
  return reportPath;
}

// Main function
async function main() {
  console.log(`Analyzing ${url}...`);
  
  // Capture screenshot
  const screenshotPath = await captureScreenshot(url);
  
  // Check accessibility
  const accessibilityIssues = await checkAccessibility(url);
  
  // Generate report
  const reportPath = generateReport(url, screenshotPath, accessibilityIssues);
  
  console.log('\nAnalysis complete!');
  console.log(`- Screenshot: ${screenshotPath}`);
  console.log(`- Accessibility issues: ${accessibilityIssues.length}`);
  console.log(`- Report: ${reportPath}`);
}

// Run main function
main().catch(error => {
  console.error('Error running analysis:', error);
}); 