#!/usr/bin/env node

/**
 * Puppeteer HTML to Markdown Converter
 * Uses Puppeteer to fetch web pages and Turndown to convert to Markdown
 */

const puppeteer = require('puppeteer');
const { convertHtmlToMarkdown, saveToFile } = require('./html-to-markdown');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

// Create output directory
const outputDir = path.join(process.cwd(), 'markdown-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Fetch a webpage and convert it to Markdown
 * @param {string} url - URL to fetch
 * @param {string} selector - Optional CSS selector to target specific content
 * @returns {Promise<object>} - HTML and Markdown content
 */
async function fetchAndConvert(url, selector = 'body') {
  let browser = null;
  
  try {
    console.log(`Fetching ${url}...`);
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node puppeteer-html-to-md.js <url> [selector]');
    console.log('Examples:');
    console.log('  node puppeteer-html-to-md.js https://example.com');
    console.log('  node puppeteer-html-to-md.js https://civictrace.com main');
    process.exit(1);
  }
  
  const url = args[0];
  const selector = args[1] || 'body';
  
  console.log(`Converting ${url} with selector "${selector}"...`);
  
  fetchAndConvert(url, selector)
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