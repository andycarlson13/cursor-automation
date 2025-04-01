#!/usr/bin/env node

/**
 * WebResearch MCP HTML to Markdown Converter
 * Uses WebResearch MCP server to fetch web pages and Turndown to convert to Markdown
 */

const { convertHtmlToMarkdown, saveToFile } = require('./html-to-markdown');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const { execSync } = require('child_process');

// Create output directory
const outputDir = path.join(process.cwd(), 'markdown-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Fetch a webpage using WebResearch MCP and convert it to Markdown
 * @param {string} url - URL to fetch
 * @returns {Promise<object>} - HTML and Markdown content
 */
async function fetchAndConvert(url) {
  try {
    console.log(`Fetching ${url} using WebResearch MCP...`);
    
    // Use the WebResearch MCP to fetch the page
    // This assumes the WebResearch MCP server is running
    // A more robust implementation would use the MCP API directly
    const visitResult = JSON.parse(
      execSync(`npx -y @mzxrai/mcp-webresearch visit "${url}"`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'inherit'] 
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
    
    // Convert to Markdown
    const markdown = convertHtmlToMarkdown(html);
    
    // Create sanitized filename from the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname.replace(/\//g, '_');
    const filename = `${hostname}${pathname}`.replace(/[^a-z0-9_.-]/gi, '_');
    
    // Save files
    const htmlPath = saveToFile(html, `${filename}.html`);
    const mdPath = saveToFile(markdown, `${filename}.md`);
    
    console.log(`HTML saved to: ${htmlPath}`);
    console.log(`Markdown saved to: ${mdPath}`);
    
    return {
      title,
      url,
      html,
      markdown,
      htmlPath,
      markdownPath: mdPath
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node webresearch-html-to-md.js <url>');
    console.log('Examples:');
    console.log('  node webresearch-html-to-md.js https://example.com');
    process.exit(1);
  }
  
  const url = args[0];
  
  console.log(`Converting ${url} using WebResearch MCP...`);
  
  fetchAndConvert(url)
    .then(result => {
      console.log('\nConversion complete!');
      console.log(`Title: ${result.title}`);
      console.log(`HTML size: ${result.html.length} bytes`);
      console.log(`Markdown size: ${result.markdown.length} bytes`);
    })
    .catch(error => {
      console.error('Conversion failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchAndConvert };