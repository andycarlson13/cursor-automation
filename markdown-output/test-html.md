  HTML to Markdown Test body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; } pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; } code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; } table { border-collapse: collapse; width: 100%; margin: 20px 0; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }

# HTML to Markdown Conversion Test

This is a test HTML file to verify our HTML to Markdown conversion functionality. It includes various HTML elements to ensure proper conversion.

## Text Formatting

This paragraph contains **bold text**, _italic text_, and `inline code`.

## Lists

### Unordered List

-   Item 1
-   Item 2
    -   Nested item 1
    -   Nested item 2
-   Item 3

### Ordered List

1.  First step
2.  Second step
3.  Third step

## Code Block

```javascript

// JavaScript code example
function convertHtmlToMarkdown(html) {
  const turndownService = new TurndownService();
  return turndownService.turndown(html);
}

console.log("HTML to Markdown conversion");
    
```

## Table

| Name | Type | Description |
| --- | --- | --- |
| html | string | HTML content to convert |
| options | object | Conversion options |
| callback | function | Optional callback function |

## Blockquote

> This is a blockquote. It represents quoted text from another source.
> 
> It can span multiple paragraphs.

## Links

Visit [GitHub](https://github.com) for more information.

The [Turndown](https://www.npmjs.com/package/turndown) package is used for HTML to Markdown conversion.

## Image

![Placeholder image](https://via.placeholder.com/150)

---

This is the end of the test HTML file.