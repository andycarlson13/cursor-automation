#!/usr/bin/env node

/**
 * Adaptive UI Analyzer
 * 
 * This script automatically selects the best analysis strategy
 * based on the complexity of the website.
 * 
 * Usage: node adaptive-ui-analyzer.js <url>
 */

const { analyzeUI } = require('./standalone-ui-analyzer');
const fs = require('fs');
const path = require('path');

// Get URL from command line arguments
const url = process.argv[2];

if (!url) {
  console.log('Usage: node adaptive-ui-analyzer.js <url>');
  process.exit(1);
}

// Output directory
const outputDir = path.join(process.cwd(), 'ui-analysis-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Run analysis with quick mode first, then try full mode if needed
 */
async function runAdaptiveAnalysis(url) {
  console.log(`Starting adaptive UI analysis for ${url}...`);
  console.log('First trying quick analysis...');
  
  try {
    // Try quick mode first with minimal screenshots
    const quickResult = await analyzeUI(url, {
      outputDir,
      fullPage: false,
      responsive: false,
      quick: true
    });
    
    if (quickResult.success) {
      console.log('Quick analysis completed successfully');
      
      // If quick mode succeeded, and the site seems simple enough, try responsive
      console.log('Site seems responsive to quick analysis. Trying responsive screenshots...');
      
      try {
        // Try responsive mode
        const responsiveResult = await analyzeUI(url, {
          outputDir,
          fullPage: false,
          responsive: true,
          quick: true
        });
        
        if (responsiveResult.success) {
          console.log('Responsive analysis completed successfully!');
          return responsiveResult;
        }
      } catch (responsiveError) {
        console.log('Responsive analysis failed, but we still have quick results');
      }
      
      return quickResult;
    }
  } catch (quickError) {
    console.log(`Quick analysis failed: ${quickError.message}`);
  }
  
  // If quick mode failed or the site is complex, try in fallback mode
  console.log('Trying in fallback mode with minimal options...');
  
  try {
    // Use very conservative options
    const fallbackResult = await analyzeUI(url, {
      outputDir,
      fullPage: false,
      responsive: false,
      quick: true
    });
    
    if (fallbackResult.success) {
      console.log('Fallback analysis completed successfully!');
      return fallbackResult;
    } else {
      throw new Error('Fallback analysis failed: ' + fallbackResult.error);
    }
  } catch (fallbackError) {
    console.error(`All analysis methods failed: ${fallbackError.message}`);
    throw fallbackError;
  }
}

// Run the adaptive analysis
runAdaptiveAnalysis(url)
  .then(result => {
    console.log('\nAnalysis Summary:');
    console.log(`- URL: ${result.report.url}`);
    console.log(`- Report location: ${result.reportPath}`);
    
    if (result.report.accessibilityIssues && result.report.accessibilityIssues.length > 0) {
      console.log(`- Accessibility issues found: ${result.report.accessibilityIssues.length}`);
    } else {
      console.log('- No major accessibility issues found');
    }
    
    // Count how many screenshots were captured
    let screenshotCount = 0;
    if (result.screenshotPath) screenshotCount++;
    if (result.responsiveScreenshots && result.responsiveScreenshots.length > 0) {
      screenshotCount += result.responsiveScreenshots.length;
    }
    
    console.log(`- Screenshots captured: ${screenshotCount}`);
    console.log(`\nResults are saved in: ${outputDir}`);
  })
  .catch(error => {
    console.error('Analysis failed completely:', error.message);
    process.exit(1);
  }); 