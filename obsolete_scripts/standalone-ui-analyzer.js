#!/usr/bin/env node

/**
 * Standalone UI Analyzer
 * 
 * This script provides UI analysis capabilities using Puppeteer
 * with no external dependencies other than Puppeteer itself.
 * 
 * Usage: node standalone-ui-analyzer.js <url>
 * 
 * Can also be imported as a module:
 * const { analyzeUI } = require('./standalone-ui-analyzer.js');
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Run a comprehensive UI analysis on the specified URL
 * @param {string} url - The URL to analyze
 * @param {object} options - Analysis options
 * @param {string} options.outputDir - Directory to save results (default: ui-analysis-results)
 * @param {boolean} options.fullPage - Whether to capture full-page screenshots (default: true)
 * @param {boolean} options.responsive - Whether to test responsive layouts (default: true)
 * @param {boolean} options.quick - Fast mode that skips slow operations (default: false)
 * @returns {Promise<object>} - Analysis results
 */
async function analyzeUI(url, options = {}) {
  // Set default options
  const outputDir = options.outputDir || path.join(process.cwd(), 'ui-analysis-results');
  const fullPage = options.fullPage !== undefined ? options.fullPage : true;
  const responsive = options.responsive !== undefined ? options.responsive : true;
  const quick = options.quick !== undefined ? options.quick : false;
  
  // Validate URL
  if (!url) {
    const error = new Error('URL is required');
    if (typeof process !== 'undefined' && process.exit) {
      console.error('Error: URL is required');
      console.log('Usage: node standalone-ui-analyzer.js <url>');
      process.exit(1);
    } else {
      throw error;
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Starting UI analysis for ${url}...`);
  
  let browser = null;
  
  try {
    // Launch Puppeteer browser with robust error handling
    console.log('Launching browser...');
    
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        timeout: 60000 // Increase timeout to 60 seconds
      });
    } catch (browserError) {
      console.error('Failed to launch browser:', browserError.message);
      console.log('Trying with alternative settings...');
      
      // Try with more conservative settings if initial launch fails
      browser = await puppeteer.launch({
        headless: true, // Use older headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        ignoreHTTPSErrors: true,
        timeout: 90000 // Even longer timeout
      });
    }
    
    console.log('Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 1280,
      height: 800
    });
    
    // After the browser is launched
    if (quick) {
      console.log('Running in quick mode with simplified analysis');
      // Use shorter timeouts in quick mode
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(15000);
    } else {
      // Set longer timeouts for full analysis
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);
    }
    
    // Navigate to URL
    console.log(`Navigating to ${url}...`);
    try {
      // In quick mode, use a simpler waitUntil strategy
      const waitOption = quick ? 'domcontentloaded' : 'networkidle2';
      const timeoutOption = quick ? 15000 : 60000;
      
      await page.goto(url, {
        waitUntil: waitOption,
        timeout: timeoutOption
      });
    } catch (navigationError) {
      console.log(`Navigation timeout, trying with simpler wait condition: ${navigationError.message}`);
      // Try again with more basic wait condition
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: quick ? 10000 : 30000
      });
    }
    
    console.log('Page loaded successfully');
    
    // Take screenshot
    console.log('Taking screenshot...');
    const timestamp = Date.now();
    const screenshotPath = path.join(outputDir, `screenshot-${timestamp}.png`);
    
    // Add timeout for screenshot operation
    let screenshotSuccess = false;
    try {
      const screenshotPromise = page.screenshot({ path: screenshotPath, fullPage });
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Screenshot timeout after 15 seconds')), 15000);
      });
      
      // Race the promises
      await Promise.race([screenshotPromise, timeoutPromise]);
      
      console.log(`Screenshot saved to ${screenshotPath}`);
      screenshotSuccess = true;
    } catch (screenshotError) {
      console.error(`Failed to take screenshot: ${screenshotError.message}`);
      console.log('Continuing with analysis without full-page screenshot...');
      
      // Try with a basic viewport screenshot instead
      try {
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Basic screenshot saved to ${screenshotPath}`);
        screenshotSuccess = true;
      } catch (basicScreenshotError) {
        console.error(`Failed to take basic screenshot: ${basicScreenshotError.message}`);
      }
    }
    
    // Get HTML content
    console.log('Getting page content...');
    const pageHtml = await page.content();
    
    // Save HTML to file
    const htmlPath = path.join(outputDir, `page-${timestamp}.html`);
    fs.writeFileSync(htmlPath, pageHtml);
    console.log(`Page HTML saved to ${htmlPath}`);
    
    // Run accessibility checks
    console.log('Analyzing page accessibility...');
    const accessibilityIssues = [];
    
    // Simple checks for common accessibility issues
    if (pageHtml.indexOf('<img') >= 0 && pageHtml.indexOf('alt=') < 0) {
      accessibilityIssues.push('Images might be missing alt attributes');
    }
    
    if (pageHtml.indexOf('<a') >= 0 && pageHtml.indexOf('href="#"') >= 0) {
      accessibilityIssues.push('Links with href="#" might not be accessible');
    }
    
    if (pageHtml.indexOf('tabindex="-1"') >= 0) {
      accessibilityIssues.push('Elements with tabindex="-1" are not keyboard accessible');
    }
    
    // More advanced accessibility analysis using page.evaluate
    try {
      const accessibilityResults = await page.evaluate(() => {
        const issues = [];
        
        // Check color contrast issues (simplified)
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;
          
          if (color === 'rgba(0, 0, 0, 0)' || bgColor === 'rgba(0, 0, 0, 0)') {
            continue; // Skip elements with transparent colors
          }
          
          // Very simplified contrast check - just look for potential issues
          if (color === bgColor) {
            issues.push(`Possible contrast issue: Text and background are same color on ${el.tagName}`);
          }
        }
        
        // Check small text
        const smallTextElements = document.querySelectorAll('*');
        for (const el of smallTextElements) {
          const style = window.getComputedStyle(el);
          const fontSize = parseInt(style.fontSize);
          if (fontSize < 12 && el.textContent.trim().length > 0) {
            issues.push(`Small text (${fontSize}px) on ${el.tagName}: "${el.textContent.substring(0, 20)}..."`);
          }
        }
        
        // Check element visibility issues
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            continue; // Skip elements with no dimensions
          }
          
          if (rect.width < 5 || rect.height < 5) {
            if (el.tagName !== 'PATH' && el.tagName !== 'SVG') { // Ignore SVG elements
              issues.push(`Tiny element (${rect.width}x${rect.height}px) found: ${el.tagName}`);
            }
          }
        }
        
        return issues;
      });
      
      // Add the results from page.evaluate
      accessibilityIssues.push(...accessibilityResults);
    } catch (evalError) {
      console.log(`Warning: Advanced accessibility analysis failed: ${evalError.message}`);
      accessibilityIssues.push('Could not run advanced accessibility checks - page may have security restrictions');
    }
    
    // Responsive testing
    let responsiveScreenshots = [];
    
    if (responsive && !quick) {
      // Only do full responsive testing in non-quick mode
      try {
        // Generate responsive screenshots
        console.log('Capturing responsive screenshots...');
        const viewports = [
          { width: 375, height: 667, name: 'mobile' },
          { width: 768, height: 1024, name: 'tablet' },
          { width: 1920, height: 1080, name: 'desktop' }
        ];
        
        for (const viewport of viewports) {
          try {
            await page.setViewport(viewport);
            
            // Use a simpler waitUntil condition
            await page.reload({ 
              waitUntil: 'domcontentloaded',
              timeout: 15000
            });
            
            const responsiveScreenshotPath = path.join(outputDir, `screenshot-${timestamp}-${viewport.name}.png`);
            
            // Add timeout for responsive screenshot
            const respScreenshotPromise = page.screenshot({ path: responsiveScreenshotPath, fullPage });
            
            // Create a timeout promise
            const respTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`${viewport.name} screenshot timeout after 10 seconds`)), 10000);
            });
            
            // Race the promises
            await Promise.race([respScreenshotPromise, respTimeoutPromise]);
            
            console.log(`${viewport.name.charAt(0).toUpperCase() + viewport.name.slice(1)} screenshot saved to ${responsiveScreenshotPath}`);
            
            responsiveScreenshots.push({
              viewport: viewport.name,
              width: viewport.width,
              height: viewport.height,
              path: responsiveScreenshotPath
            });
          } catch (viewportError) {
            console.log(`Warning: Failed to capture ${viewport.name} screenshot: ${viewportError.message}`);
            
            // Try with a non-fullpage screenshot as fallback
            try {
              const responsiveScreenshotPath = path.join(outputDir, `screenshot-${timestamp}-${viewport.name}.png`);
              await page.screenshot({ path: responsiveScreenshotPath, fullPage: false });
              console.log(`Basic ${viewport.name} screenshot saved to ${responsiveScreenshotPath}`);
              
              responsiveScreenshots.push({
                viewport: viewport.name,
                width: viewport.width,
                height: viewport.height,
                path: responsiveScreenshotPath
              });
            } catch (fallbackError) {
              console.error(`Failed to take fallback ${viewport.name} screenshot: ${fallbackError.message}`);
            }
          }
        }
      } catch (responsiveError) {
        console.log(`Warning: Responsive testing failed: ${responsiveError.message}`);
      }
    } else if (responsive && quick) {
      // In quick mode, just do mobile screenshot
      try {
        console.log('Quick mode: Capturing only mobile screenshot...');
        const mobileViewport = { width: 375, height: 667, name: 'mobile' };
        
        try {
          await page.setViewport(mobileViewport);
          await page.reload({ 
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
          
          const responsiveScreenshotPath = path.join(outputDir, `screenshot-${timestamp}-mobile.png`);
          await page.screenshot({ 
            path: responsiveScreenshotPath, 
            fullPage: false,
            timeout: 5000
          });
          
          console.log(`Mobile screenshot saved to ${responsiveScreenshotPath}`);
          
          responsiveScreenshots.push({
            viewport: mobileViewport.name,
            width: mobileViewport.width,
            height: mobileViewport.height,
            path: responsiveScreenshotPath
          });
        } catch (mobileError) {
          console.log(`Warning: Failed to capture mobile screenshot: ${mobileError.message}`);
        }
      } catch (quickResponsiveError) {
        console.log(`Warning: Quick responsive testing failed: ${quickResponsiveError.message}`);
      }
    }
    
    // Generate report
    const reportFilename = `ui-analysis-report-${timestamp}.json`;
    const reportFilepath = path.join(outputDir, reportFilename);
    
    const report = {
      url,
      timestamp: new Date().toISOString(),
      accessibilityIssues,
      htmlSize: pageHtml.length,
      screenshot: screenshotPath,
      responsiveScreenshots: responsive ? responsiveScreenshots.map(s => s.path) : []
    };
    
    fs.writeFileSync(reportFilepath, JSON.stringify(report, null, 2));
    console.log(`Analysis report saved to ${reportFilepath}`);
    
    return {
      success: true,
      report,
      reportPath: reportFilepath,
      screenshotPath,
      htmlPath,
      responsiveScreenshots
    };
  } catch (error) {
    console.error('Error during UI analysis:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Clean up
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Warning: Failed to close browser:', closeError.message);
      }
    }
  }
}

// Only run the main function if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  // Handle command line arguments
  const url = process.argv[2];
  if (!url) {
    console.log('Usage: node standalone-ui-analyzer.js <url>');
    process.exit(1);
  }

  // Run the analysis
  analyzeUI(url)
    .then(result => {
      if (result.success) {
        console.log('UI analysis completed successfully!');
        console.log('\nSummary:');
        console.log(`- URL: ${result.report.url}`);
        console.log(`- Accessibility issues found: ${result.report.accessibilityIssues.length}`);
        console.log(`- Report location: ${result.reportPath}`);
        console.log(`- Screenshots captured: ${result.responsiveScreenshots ? result.responsiveScreenshots.length + 1 : 1}`);
      } else {
        console.error('UI analysis failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

// Export the analyzeUI function for use as a module
module.exports = { analyzeUI }; 