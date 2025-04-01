#!/usr/bin/env node

/**
 * Enhanced Puppeteer MCP Server
 * Includes HTML to Markdown functionality as part of the Puppeteer MCP server
 */

const path = require('path');
const fs = require('fs');
const { URL } = require('url');

// Dynamically import required packages
let puppeteer, TurndownService, createServer;

try {
  puppeteer = require('puppeteer');
  TurndownService = require('turndown');
  
  // Try different import approaches for the MCP SDK
  try {
    const sdk = require('@modelcontextprotocol/sdk');
    createServer = sdk.default ? sdk.default.createServer : sdk.createServer;
  } catch (importError) {
    console.error('Error importing @modelcontextprotocol/sdk:', importError.message);
    console.log('Trying alternative import method...');
    
    // Try to find the SDK in node_modules
    const possibleSdkPaths = [
      path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'index.js'),
      path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'index.cjs'),
      path.join(process.cwd(), '..', 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'index.js')
    ];
    
    let sdkFound = false;
    for (const sdkPath of possibleSdkPaths) {
      if (fs.existsSync(sdkPath)) {
        const sdk = require(sdkPath);
        createServer = sdk.default ? sdk.default.createServer : sdk.createServer;
        sdkFound = true;
        console.log(`Found SDK at ${sdkPath}`);
        break;
      }
    }
    
    if (!sdkFound) {
      console.error('Could not find @modelcontextprotocol/sdk. Please install it using npm.');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Error loading required packages:', error.message);
  console.error('Please install missing packages using: npm install puppeteer turndown @modelcontextprotocol/sdk');
  process.exit(1);
}

// Create Turndown service instance for HTML to MD conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

// Add code block support
turndownService.addRule('codeBlocks', {
  filter: ['pre'],
  replacement: function (content, node) {
    const language = node.querySelector('code')?.className.match(/language-(\w+)/)?.[1] || '';
    return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
});

// Add table support
turndownService.addRule('tables', {
  filter: ['table'],
  replacement: function (content, node) {
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

// Create the MCP server
const server = createServer({
  namespace: 'mcp_puppeteer_enhanced',
  id: 'mcp_puppeteer_enhanced',
  displayName: 'Enhanced Puppeteer MCP Server',
  description: 'Browser automation with built-in HTML to Markdown conversion',
  tools: [
    // Original Puppeteer tools
    {
      name: 'open',
      description: 'Open a new browser page at the given URL',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to open'
          }
        },
        required: ['url']
      },
      handler: async ({ url }) => {
        try {
          const browser = await getBrowser();
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0' });
          return { success: true, title: await page.title() };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    {
      name: 'take_screenshot',
      description: 'Take a screenshot of the current page',
      parameters: {
        type: 'object',
        properties: {
          fullPage: {
            type: 'boolean',
            description: 'Whether to take a screenshot of the full page or just the viewport',
            default: false
          }
        }
      },
      handler: async ({ fullPage = false }) => {
        try {
          const page = await getPage();
          const screenshotBuffer = await page.screenshot({ fullPage });
          const base64Image = screenshotBuffer.toString('base64');
          return { 
            success: true, 
            image: base64Image,
            imageType: 'image/png',
            imageEncoding: 'base64'
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    // HTML to Markdown tools
    {
      name: 'html_to_markdown',
      description: 'Convert HTML from the current page to Markdown',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to extract specific content (e.g., "article", ".content")',
            default: 'body'
          }
        }
      },
      handler: async ({ selector = 'body' }) => {
        try {
          const page = await getPage();
          
          // Extract HTML based on selector
          const html = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? element.outerHTML : document.body.outerHTML;
          }, selector);
          
          // Convert to markdown
          const markdown = turndownService.turndown(html);
          return { 
            success: true, 
            title: await page.title(),
            markdown 
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    {
      name: 'convert_url_to_markdown',
      description: 'Fetch a URL and convert its HTML to Markdown',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to fetch and convert'
          },
          selector: {
            type: 'string',
            description: 'CSS selector to extract specific content',
            default: 'body'
          }
        },
        required: ['url']
      },
      handler: async ({ url, selector = 'body' }) => {
        let browser;
        let page;
        
        try {
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0' });
          
          // Get page title
          const title = await page.title();
          
          // Extract HTML based on selector
          const html = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? element.outerHTML : document.body.outerHTML;
          }, selector);
          
          // Convert to markdown
          const markdown = turndownService.turndown(html);
          
          return { 
            success: true, 
            title,
            url,
            markdown
          };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          if (page) await page.close();
          if (browser) await browser.close();
        }
      }
    },
    {
      name: 'analyze_website',
      description: 'Analyze a website and return comprehensive info including markdown conversion',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to analyze'
          },
          takeScreenshot: {
            type: 'boolean',
            description: 'Whether to include a screenshot',
            default: true
          },
          selector: {
            type: 'string',
            description: 'CSS selector for content extraction',
            default: 'body'
          }
        },
        required: ['url']
      },
      handler: async ({ url, takeScreenshot = true, selector = 'body' }) => {
        let browser;
        let page;
        
        try {
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0' });
          
          // Get page metadata
          const title = await page.title();
          const metaDescription = await page.evaluate(() => {
            const metaDesc = document.querySelector('meta[name="description"]');
            return metaDesc ? metaDesc.getAttribute('content') : '';
          });
          
          // Extract HTML based on selector
          const html = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? element.outerHTML : document.body.outerHTML;
          }, selector);
          
          // Convert to markdown
          const markdown = turndownService.turndown(html);
          
          // Take screenshot if requested
          let screenshotData = null;
          if (takeScreenshot) {
            const screenshotBuffer = await page.screenshot({ fullPage: true });
            screenshotData = screenshotBuffer.toString('base64');
          }
          
          // Get page stats
          const pageStats = await page.evaluate(() => {
            return {
              links: document.querySelectorAll('a').length,
              images: document.querySelectorAll('img').length,
              headings: {
                h1: document.querySelectorAll('h1').length,
                h2: document.querySelectorAll('h2').length,
                h3: document.querySelectorAll('h3').length
              },
              paragraphs: document.querySelectorAll('p').length,
              iframes: document.querySelectorAll('iframe').length
            };
          });
          
          return { 
            success: true, 
            url,
            title,
            metaDescription,
            stats: pageStats,
            markdown,
            screenshot: screenshotData ? {
              data: screenshotData,
              type: 'image/png',
              encoding: 'base64'
            } : null
          };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          if (page) await page.close();
          if (browser) await browser.close();
        }
      }
    }
  ]
});

// Global browser instance
let globalBrowser = null;
let activePage = null;

// Get or create a browser instance
async function getBrowser() {
  if (!globalBrowser) {
    globalBrowser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return globalBrowser;
}

// Get active page or create a new one
async function getPage() {
  const browser = await getBrowser();
  
  if (!activePage) {
    // Get all open pages
    const pages = await browser.pages();
    
    if (pages.length > 0) {
      // Use the first open page
      activePage = pages[0];
    } else {
      // Create a new page if none exist
      activePage = await browser.newPage();
    }
  }
  
  return activePage;
}

// Handle cleanup on exit
process.on('exit', async () => {
  if (globalBrowser) {
    await globalBrowser.close();
  }
});

// Start the server
console.log('Starting Enhanced Puppeteer MCP Server with HTML to Markdown capabilities...');
server.start();
console.log('Enhanced Puppeteer MCP Server started successfully'); 