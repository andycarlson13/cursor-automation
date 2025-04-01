#!/usr/bin/env node

/**
 * UI Analyzer with HTML to Markdown Conversion
 * 
 * Combines the functionality of the standalone UI analyzer with HTML to Markdown conversion
 * Uses the existing UI analyzer to fetch web content and the Turndown library for conversion
 */

const { analyzeUI } = require('./standalone-ui-analyzer');
const TurndownService = require('turndown');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Create a new Turndown instance with configuration
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

// Add custom rules for better conversion
turndownService.addRule('codeBlocks', {
  filter: ['pre'],
  replacement: function(content, node) {
    // Check if there's a code element inside
    const language = node.querySelector && node.querySelector('code')?.className.match(/language-(\w+)/)?.[1] || '';
    return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
});

/**
 * Analyze a URL and convert its HTML to Markdown
 * @param {string} url - The URL to analyze and convert
 * @param {object} options - Analysis options (passed to analyzeUI)
 * @returns {Promise<object>} - Analysis results including Markdown
 */
async function analyzeAndConvert(targetUrl, options = {}) {
  // Set default output directory
  const outputDir = options.outputDir || path.join(process.cwd(), 'markdown-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Analyzing and converting ${targetUrl}...`);
  
  try {
    // Run the UI analyzer to fetch the page content
    const analysisResult = await analyzeUI(targetUrl, options);
    
    // Find the HTML file in the results
    let htmlFilePath = '';
    if (analysisResult.htmlPath) {
      htmlFilePath = analysisResult.htmlPath;
    } else if (analysisResult.files && Array.isArray(analysisResult.files)) {
      const htmlFiles = analysisResult.files.filter(file => file.endsWith('.html'));
      if (htmlFiles.length > 0) {
        htmlFilePath = htmlFiles[0];
      }
    } else {
      // Look for HTML files in the output directory
      const files = fs.readdirSync(outputDir);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      if (htmlFiles.length > 0) {
        htmlFilePath = path.join(outputDir, htmlFiles[htmlFiles.length - 1]);
      }
    }
    
    if (!htmlFilePath || !fs.existsSync(htmlFilePath)) {
      throw new Error('No HTML content found in analysis results');
    }
    
    console.log(`Found HTML file: ${htmlFilePath}`);
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Convert HTML to Markdown
    console.log('Converting HTML to Markdown...');
    const markdown = turndownService.turndown(htmlContent);
    
    // Create a filename for the Markdown file
    const parsedUrl = new url.URL(targetUrl);
    const urlPath = parsedUrl.pathname.replace(/\//g, '_');
    const hostname = parsedUrl.hostname;
    const filename = `${hostname}${urlPath}`.replace(/[^a-z0-9_.-]/gi, '_');
    const markdownPath = path.join(outputDir, `${filename}.md`);
    
    // Save the Markdown to a file
    fs.writeFileSync(markdownPath, markdown);
    console.log(`Markdown saved to: ${markdownPath}`);
    
    // Return the results
    return {
      ...analysisResult,
      markdownPath,
      markdown,
      htmlPath: htmlFilePath
    };
  } catch (error) {
    console.error(`Error during analysis and conversion: ${error.message}`);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node ui-analyzer-html-to-md.js <url> [outputDir]');
    console.log('Examples:');
    console.log('  node ui-analyzer-html-to-md.js https://example.com');
    console.log('  node ui-analyzer-html-to-md.js https://civictrace.com ./output');
    process.exit(1);
  }
  
  const targetUrl = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'markdown-output');
  
  // Run the analysis and conversion
  analyzeAndConvert(targetUrl, { outputDir, quick: true })
    .then(result => {
      console.log('\nAnalysis and conversion complete!');
      if (result.htmlPath) {
        console.log(`HTML file: ${result.htmlPath}`);
      }
      console.log(`Markdown file: ${result.markdownPath}`);
      
      // Look for screenshot files
      if (result.files && Array.isArray(result.files)) {
        const screenshots = result.files.filter(file => file.endsWith('.png'));
        if (screenshots.length > 0) {
          console.log(`Screenshot file: ${screenshots[0]}`);
        }
      }
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzeAndConvert }; 