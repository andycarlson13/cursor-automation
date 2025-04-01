#!/usr/bin/env node

/**
 * Unified HTML to Markdown Converter
 * Supports multiple methods of conversion:
 * 1. Local HTML file conversion (using Turndown)
 * 2. Web page conversion using WebResearch MCP
 * 3. Web page conversion using Puppeteer
 */

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const { URL } = require('url');

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'markdown-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize Turndown with configuration
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
    const language = node.querySelector('code')?.className.match(/language-(\w+)/)?.[1] || '';
    return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
});

// Add support for tables
turndownService.addRule('tables', {
  filter: ['table'],
  replacement: function(content, node) {
    // Extract header row and rows from the table
    const rows = Array.from(node.querySelectorAll('tr'));
    if (rows.length === 0) return content;
    
    // Process header
    const headerRow = rows[0];
    const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());
    if (headers.length === 0) return content;
    
    // Create table markdown
    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
      table += '| ' + cells.join(' | ') + ' |\n';
    }
    
    return '\n' + table + '\n';
  }
});

/**
 * Convert HTML string to Markdown
 * @param {string} html - HTML content to convert
 * @returns {string} - Markdown content
 */
function convertHtmlToMarkdown(html) {
  return turndownService.turndown(html);
}

/**
 * Save content to a file
 * @param {string} content - Content to save
 * @param {string} filename - Filename to save to
 * @returns {string} - Path to saved file
 */
function saveToFile(content, filename) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Convert HTML to Markdown and save both files
 * @param {string} html - HTML content
 * @param {string} baseFilename - Base filename without extension
 * @returns {object} - Object with paths to HTML and Markdown files
 */
function convertAndSave(html, baseFilename) {
  const markdown = convertHtmlToMarkdown(html);
  
  const htmlPath = saveToFile(html, `${baseFilename}.html`);
  const mdPath = saveToFile(markdown, `${baseFilename}.md`);
  
  return {
    html: htmlPath,
    markdown: mdPath,
    markdownContent: markdown
  };
}

/**
 * Convert a local HTML file to Markdown
 * @param {string} htmlFile - Path to HTML file
 * @returns {object} - Conversion result
 */
function convertLocalFile(htmlFile) {
  try {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const baseFilename = path.basename(htmlFile, path.extname(htmlFile));
    
    return convertAndSave(html, baseFilename);
  } catch (error) {
    console.error('Error converting local file:', error.message);
    throw error;
  }
}

/**
 * Fetch a webpage using Puppeteer and convert it to Markdown
 * @param {string} url - URL to fetch
 * @param {string} selector - Optional CSS selector to target specific content
 * @returns {Promise<object>} - HTML and Markdown content
 */
async function convertWithPuppeteer(url, selector = 'body') {
  let browser = null;
  
  try {
    console.log(`Fetching ${url} using Puppeteer...`);
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    const page = await browser.newPage();
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Get page title
    const title = await page.title();
    
    // Extract HTML content based on selector
    const html = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element ? element.outerHTML : document.body.outerHTML;
    }, selector);
    
    // Create sanitized filename from the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname.replace(/\//g, '_');
    const filename = `${hostname}${pathname}`.replace(/[^a-z0-9_.-]/gi, '_');
    
    // Convert and save
    const result = convertAndSave(html, filename);
    
    return {
      title,
      url,
      html,
      markdown: result.markdownContent,
      htmlPath: result.html,
      markdownPath: result.markdown
    };
  } catch (error) {
    console.error('Error converting with Puppeteer:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Fetch a webpage using WebResearch MCP and convert it to Markdown
 * @param {string} url - URL to fetch
 * @returns {Promise<object>} - HTML and Markdown content
 */
async function convertWithWebResearch(url) {
  try {
    console.log(`Fetching ${url} using WebResearch MCP...`);
    
    // Check if WebResearch MCP is running
    try {
      // Use the WebResearch MCP to fetch the page
      const visitResult = JSON.parse(
        execSync(`npx -y @mzxrai/mcp-webresearch visit "${url}"`, { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'] 
        })
      );
      
      // Extract HTML content
      const html = visitResult.content;
      if (!html) {
        throw new Error('Failed to retrieve HTML content');
      }
      
      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : url;
      
      // Create sanitized filename from the URL
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname.replace(/\//g, '_');
      const filename = `${hostname}${pathname}`.replace(/[^a-z0-9_.-]/gi, '_');
      
      // Convert and save
      const result = convertAndSave(html, filename);
      
      return {
        title,
        url,
        html,
        markdown: result.markdownContent,
        htmlPath: result.html,
        markdownPath: result.markdown
      };
    } catch (error) {
      console.error('WebResearch MCP error:', error.message);
      console.log('Falling back to Puppeteer...');
      return convertWithPuppeteer(url);
    }
  } catch (error) {
    console.error('Error converting with WebResearch:', error.message);
    throw error;
  }
}

/**
 * Main function to handle conversion based on arguments
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Unified HTML to Markdown Converter

Usage:
  node html-to-markdown-unified.js [options] <input>

Options:
  --method=<method>  Conversion method: local, puppeteer, webresearch (default: auto)
  --selector=<sel>   CSS selector for targeting specific content (for puppeteer method)

Examples:
  # Convert local HTML file
  node html-to-markdown-unified.js path/to/file.html

  # Convert web page using auto-detection
  node html-to-markdown-unified.js https://example.com

  # Convert web page with specific method
  node html-to-markdown-unified.js --method=webresearch https://example.com

  # Convert specific content from web page
  node html-to-markdown-unified.js --method=puppeteer --selector=main https://example.com
`);
    process.exit(1);
  }
  
  // Parse options
  let method = 'auto';
  let selector = 'body';
  let input = '';
  
  for (const arg of args) {
    if (arg.startsWith('--method=')) {
      method = arg.split('=')[1];
    } else if (arg.startsWith('--selector=')) {
      selector = arg.split('=')[1];
    } else {
      input = arg;
    }
  }
  
  if (!input) {
    console.error('Error: No input file or URL provided');
    process.exit(1);
  }
  
  try {
    let result;
    
    // Determine if input is a file or URL
    const isUrl = input.startsWith('http://') || input.startsWith('https://');
    
    if (isUrl) {
      if (method === 'auto') {
        // Try WebResearch first, fall back to Puppeteer
        try {
          result = await convertWithWebResearch(input);
        } catch (error) {
          console.log('WebResearch failed, trying Puppeteer...');
          result = await convertWithPuppeteer(input, selector);
        }
      } else if (method === 'webresearch') {
        result = await convertWithWebResearch(input);
      } else if (method === 'puppeteer') {
        result = await convertWithPuppeteer(input, selector);
      } else {
        console.error(`Error: Unknown method "${method}"`);
        process.exit(1);
      }
      
      console.log('\nConversion complete!');
      console.log(`Title: ${result.title}`);
      console.log(`HTML saved to: ${result.htmlPath}`);
      console.log(`Markdown saved to: ${result.markdownPath}`);
      console.log(`HTML size: ${result.html.length} bytes`);
      console.log(`Markdown size: ${result.markdown.length} bytes`);
    } else {
      // Local file conversion
      result = convertLocalFile(input);
      
      console.log('\nConversion complete!');
      console.log(`HTML saved to: ${result.html}`);
      console.log(`Markdown saved to: ${result.markdown}`);
      console.log(`Markdown size: ${result.markdownContent.length} bytes`);
    }
  } catch (error) {
    console.error('Conversion failed:', error.message);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  main();
}

module.exports = {
  convertHtmlToMarkdown,
  saveToFile,
  convertAndSave,
  convertLocalFile,
  convertWithPuppeteer,
  convertWithWebResearch
};