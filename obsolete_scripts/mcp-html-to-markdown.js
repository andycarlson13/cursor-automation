#!/usr/bin/env node

const { createServer } = require('@modelcontextprotocol/sdk').default;
const TurndownService = require('turndown');
const puppeteer = require('puppeteer');

// Create a new Turndown service instance
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

// Enhance the Turndown service with common customizations
turndownService.addRule('codeBlocks', {
  filter: ['pre'],
  replacement: function (content, node) {
    // Check if there's a code element inside
    const language = node.querySelector('code')?.className.match(/language-(\w+)/)?.[1] || '';
    return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
});

// Add support for tables
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

// MCP server definition
const server = createServer({
  namespace: 'mcp_html_to_markdown',
  id: 'mcp_html_to_markdown',
  displayName: 'HTML to Markdown Converter',
  description: 'Converts HTML to Markdown format',
  tools: [
    {
      name: 'convert_string',
      description: 'Convert HTML string to Markdown',
      parameters: {
        type: 'object',
        properties: {
          html: {
            type: 'string',
            description: 'HTML content to convert to Markdown'
          }
        },
        required: ['html']
      },
      handler: async ({ html }) => {
        try {
          const markdown = turndownService.turndown(html);
          return { markdown };
        } catch (error) {
          return { error: error.message };
        }
      }
    },
    {
      name: 'convert_url',
      description: 'Convert HTML from a URL to Markdown',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to fetch and convert to Markdown'
          },
          selector: {
            type: 'string',
            description: 'Optional CSS selector to extract specific content (e.g., "article", ".content")',
            default: 'body'
          }
        },
        required: ['url']
      },
      handler: async ({ url, selector = 'body' }) => {
        let browser;
        try {
          // Launch puppeteer
          browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0' });
          
          // Extract HTML based on selector
          const html = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? element.outerHTML : document.body.outerHTML;
          }, selector);
          
          // Convert to markdown
          const markdown = turndownService.turndown(html);
          return { markdown };
        } catch (error) {
          return { error: error.message };
        } finally {
          if (browser) await browser.close();
        }
      }
    },
    {
      name: 'get_url_content',
      description: 'Get both HTML and Markdown from a URL',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to fetch content from'
          },
          selector: {
            type: 'string',
            description: 'Optional CSS selector to extract specific content',
            default: 'body'
          }
        },
        required: ['url']
      },
      handler: async ({ url, selector = 'body' }) => {
        let browser;
        try {
          browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0' });
          
          // Extract title
          const title = await page.title();
          
          // Extract HTML based on selector
          const html = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? element.outerHTML : document.body.outerHTML;
          }, selector);
          
          // Convert to markdown
          const markdown = turndownService.turndown(html);
          return { title, html, markdown };
        } catch (error) {
          return { error: error.message };
        } finally {
          if (browser) await browser.close();
        }
      }
    }
  ]
});

// Start the server
server.start(); 