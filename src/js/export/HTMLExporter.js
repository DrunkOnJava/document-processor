/**
 * @file HTMLExporter.js
 * @description Exports document content to HTML format
 * @module export/HTMLExporter
 */

import { SELECTORS } from '../utils/Constants.js';
import { getAllDocumentContainers } from '../utils/DOMUtils.js';

/**
 * Handles HTML export functionality
 */
export class HTMLExporter {
  constructor() {
    this.documentTitle = 'Exported Document';
  }

  /**
   * Export document as HTML
   * @returns {string} Complete HTML document
   */
  export() {
    const content = this.collectAllContent();
    return this.generateHTMLDocument(content);
  }

  /**
   * Collect content from all pages
   * @returns {string} Combined HTML content
   */
  collectAllContent() {
    const containers = getAllDocumentContainers();
    let combinedContent = '';
    
    containers.forEach((container, index) => {
      const content = container.querySelector(SELECTORS.EDITABLE_CONTENT);
      if (content) {
        // Add page break marker except for last page
        if (index > 0) {
          combinedContent += '<div class="page-break"></div>\n';
        }
        
        combinedContent += `<div class="page page-${index + 1}">\n`;
        combinedContent += content.innerHTML;
        combinedContent += '\n</div>\n';
      }
    });
    
    return combinedContent;
  }

  /**
   * Generate complete HTML document
   * @param {string} content - Document content
   * @returns {string} Complete HTML
   */
  generateHTMLDocument(content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(this.documentTitle)}</title>
    <style>
        ${this.generateStyles()}
    </style>
</head>
<body>
    <div class="document-container">
        ${content}
    </div>
</body>
</html>`;
  }

  /**
   * Generate CSS styles for exported document
   * @returns {string} CSS styles
   */
  generateStyles() {
    return `
        /* Base styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
        }
        
        /* Page structure */
        .document-container {
            background: white;
        }
        
        .page {
            margin-bottom: 2em;
        }
        
        .page-break {
            page-break-after: always;
            break-after: page;
            height: 0;
            margin: 0;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-weight: bold;
        }
        
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.17em; }
        h4 { font-size: 1em; }
        h5 { font-size: 0.83em; }
        h6 { font-size: 0.67em; }
        
        p {
            margin: 1em 0;
        }
        
        /* Lists */
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        
        li {
            margin: 0.5em 0;
        }
        
        /* Tables */
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        /* Images */
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em 0;
        }
        
        /* Quotes and code */
        blockquote {
            margin: 1em 0;
            padding-left: 1em;
            border-left: 3px solid #ddd;
            color: #666;
        }
        
        pre {
            background: #f5f5f5;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
            margin: 1em 0;
        }
        
        code {
            background: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        /* Links */
        a {
            color: #0066cc;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        /* Table of Contents */
        .table-of-contents {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .table-of-contents h2 {
            margin-top: 0;
            text-align: center;
        }
        
        .toc-entry {
            margin-bottom: 8px;
        }
        
        .toc-level-2 {
            margin-left: 20px;
        }
        
        .toc-level-3 {
            margin-left: 40px;
        }
        
        /* Line spacing classes */
        .spacing-1 { line-height: 1 !important; }
        .spacing-1-15 { line-height: 1.15 !important; }
        .spacing-1-5 { line-height: 1.5 !important; }
        .spacing-2 { line-height: 2 !important; }
        .spacing-2-5 { line-height: 2.5 !important; }
        .spacing-3 { line-height: 3 !important; }
        
        /* Text alignment */
        [style*="text-align: left"] { text-align: left !important; }
        [style*="text-align: center"] { text-align: center !important; }
        [style*="text-align: right"] { text-align: right !important; }
        
        /* Print styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .page {
                page-break-after: always;
                break-after: page;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
        }
    `;
  }

  /**
   * Escape HTML for safe insertion
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}