/**
 * @file testData.js
 * @description Test data fixtures for unit and integration tests
 */

export const testDocuments = {
  // Simple single-page document
  simple: {
    version: '3.0',
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-01T00:00:00.000Z',
      pageCount: 1
    },
    pages: [
      {
        content: '<p>This is a simple test document.</p>',
        pageNumber: 1
      }
    ],
    settings: {
      lineSpacing: 2
    }
  },

  // Multi-page document
  multiPage: {
    version: '3.0',
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-01T00:00:00.000Z',
      pageCount: 3
    },
    pages: [
      {
        content: '<h1>Chapter 1</h1><p>First page content with enough text to fill a page.</p>',
        pageNumber: 1
      },
      {
        content: '<h2>Section 1.1</h2><p>Second page content.</p><p>More content here.</p>',
        pageNumber: 2
      },
      {
        content: '<p>Third page content.</p><ul><li>List item 1</li><li>List item 2</li></ul>',
        pageNumber: 3
      }
    ],
    settings: {
      lineSpacing: 1.5
    }
  },

  // Document with formatting
  formatted: {
    version: '3.0',
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-01T00:00:00.000Z',
      pageCount: 1
    },
    pages: [
      {
        content: '<p><strong>Bold text</strong> and <em>italic text</em> and <u>underlined text</u>.</p><blockquote>A quote</blockquote>',
        pageNumber: 1
      }
    ],
    settings: {
      lineSpacing: 2
    }
  },

  // Document with table of contents
  withTOC: {
    version: '3.0',
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-01T00:00:00.000Z',
      pageCount: 2,
      hasTOC: true
    },
    pages: [
      {
        content: '<div class="table-of-contents"><h2>Table of Contents</h2><div class="toc-content"></div></div>',
        pageNumber: 1
      },
      {
        content: '<h1>Introduction</h1><p>Content</p><h2>Background</h2><p>More content</p>',
        pageNumber: 2
      }
    ],
    settings: {
      lineSpacing: 2
    }
  },

  // Legacy format (for migration testing)
  legacy: {
    content: '<p>Legacy document content without pages array.</p>',
    timestamp: '2023-12-01T00:00:00.000Z'
  }
};

export const testHTML = {
  // Sample HTML content for import testing
  basic: `
    <!DOCTYPE html>
    <html>
    <head><title>Test Document</title></head>
    <body>
      <h1>Test Document</h1>
      <p>This is a paragraph.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    </body>
    </html>
  `,

  // HTML with complex formatting
  complex: `
    <!DOCTYPE html>
    <html>
    <head><title>Complex Document</title></head>
    <body>
      <h1>Main Title</h1>
      <p>Paragraph with <strong>bold</strong>, <em>italic</em>, and <u>underline</u>.</p>
      <table>
        <tr><th>Header 1</th><th>Header 2</th></tr>
        <tr><td>Cell 1</td><td>Cell 2</td></tr>
      </table>
      <blockquote>This is a quote.</blockquote>
      <pre><code>Code block</code></pre>
    </body>
    </html>
  `
};

export const testMarkdown = {
  // Sample markdown for import testing
  basic: `# Test Document

This is a paragraph.

- List item 1
- List item 2`,

  // Markdown with various elements
  complex: `# Main Title

Paragraph with **bold**, *italic*, and ~~strikethrough~~.

## Subheading

> This is a quote.

\`\`\`javascript
// Code block
const test = "example";
\`\`\`

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`
};

export const testSelections = {
  // Mock selection ranges for testing
  collapsed: {
    rangeCount: 1,
    isCollapsed: true,
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0
  },

  singleParagraph: {
    rangeCount: 1,
    isCollapsed: false,
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 10
  },

  multiParagraph: {
    rangeCount: 1,
    isCollapsed: false,
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
    toString: () => 'Selected text across multiple paragraphs'
  }
};

export const testStyles = {
  // Common style configurations
  defaultParagraph: {
    lineHeight: '',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    margin: '0 0 1em 0'
  },

  heading1: {
    fontSize: '2em',
    fontWeight: 'bold',
    margin: '0.67em 0'
  },

  blockquote: {
    margin: '1em 40px',
    paddingLeft: '10px',
    borderLeft: '3px solid #ccc'
  }
};