#!/usr/bin/env node

/**
 * HTML to Markdown Converter Utility
 * Uses Turndown to convert HTML to Markdown,
 * and can work with the Puppeteer MCP server
 */

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

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

// If this script is run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node html-to-markdown.js <html-file>');
    process.exit(1);
  }
  
  const htmlFile = args[0];
  try {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const baseFilename = path.basename(htmlFile, path.extname(htmlFile));
    
    const result = convertAndSave(html, baseFilename);
    
    console.log(`HTML saved to: ${result.html}`);
    console.log(`Markdown saved to: ${result.markdown}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  convertHtmlToMarkdown,
  saveToFile,
  convertAndSave
}; 