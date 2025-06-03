# Document Processor - LLM Optimization Refactoring Plan

## Phase 1: Modularization (Week 1)

### 1.1 Extract and Organize Styles
Create `src/styles/` directory:
```
src/styles/
├── base.css          # Reset and base styles
├── layout.css        # Page layout and structure
├── components.css    # UI component styles
├── editor.css        # Editor-specific styles
├── print.css         # Print media queries
└── themes.css        # Future: theme support
```

### 1.2 Split JavaScript into Modules
Create `src/js/` directory:
```
src/js/
├── core/
│   ├── DocumentEngine.js    # Main orchestrator
│   ├── PageManager.js       # Pagination logic
│   ├── ContentEditor.js     # Editing functionality
│   └── constants.js         # Shared constants
├── components/
│   ├── Toolbar.js           # Format toolbar
│   ├── TableOfContents.js   # TOC generation
│   ├── ImageHandler.js      # Image management
│   └── TableManager.js      # Table operations
├── utils/
│   ├── formatter.js         # Text formatting utilities
│   ├── validator.js         # Input validation
│   └── domHelpers.js        # DOM manipulation helpers
├── storage/
│   ├── LocalStorage.js      # Browser storage
│   └── AutoSave.js          # Auto-save logic
├── export/
│   ├── ExportManager.js     # Export orchestrator
│   ├── HtmlExporter.js      # HTML export
│   ├── MarkdownExporter.js  # Markdown conversion
│   └── JsonExporter.js      # JSON format
└── app.js                   # Application entry point
```

### 1.3 Create Module Templates

**Example: PageManager.js**
```javascript
/**
 * @file PageManager.js
 * @description Handles document pagination, page breaks, and content flow
 * 
 * @author Document Processor Team
 * @version 2.1.0
 * 
 * @dependencies
 * - ContentEditor: For content manipulation
 * - constants: Page dimensions and settings
 * - domHelpers: DOM utilities
 * 
 * @exports PageManager
 */

import { PAGE_HEIGHT, PAGE_WIDTH, MARGIN } from './constants.js';
import { createElement, measureHeight } from '../utils/domHelpers.js';

export class PageManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.pages = [];
    this.currentPage = 1;
  }

  /**
   * Creates a new page with proper formatting
   * @returns {HTMLElement} New page element
   */
  createPage() {
    const page = createElement('div', {
      className: 'page',
      attributes: { 'data-page': this.pages.length + 1 }
    });
    
    // Add page structure...
    this.pages.push(page);
    return page;
  }

  /**
   * Checks if content overflows current page
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if overflow detected
   */
  checkOverflow(element) {
    const elementHeight = measureHeight(element);
    const pageHeight = PAGE_HEIGHT - (MARGIN * 2);
    return elementHeight > pageHeight;
  }

  // Additional methods...
}
```

## Phase 2: Documentation Enhancement (Week 2)

### 2.1 Add JSDoc to All Functions
```javascript
/**
 * Formats selected text with specified style
 * @param {string} command - Formatting command (bold, italic, etc.)
 * @param {string} [value] - Optional value for commands like createLink
 * @throws {Error} If no text is selected
 * @returns {boolean} Success status
 * 
 * @example
 * // Make selected text bold
 * formatSelection('bold');
 * 
 * // Create a link
 * formatSelection('createLink', 'https://example.com');
 */
function formatSelection(command, value = null) {
  // Implementation...
}
```

### 2.2 Create Component Documentation
For each module, create a corresponding `.md` file:
```
docs/components/
├── PageManager.md
├── ContentEditor.md
├── TableOfContents.md
└── ExportManager.md
```

### 2.3 Add Inline Documentation
```javascript
// Constants with clear documentation
const PAGE_CONFIG = {
  // US Letter dimensions in pixels at 96 DPI
  WIDTH: 816,  // 8.5 inches
  HEIGHT: 1056, // 11 inches
  
  // Standard 1-inch margins
  MARGIN: {
    TOP: 96,
    RIGHT: 96,
    BOTTOM: 96,
    LEFT: 96
  },
  
  // Content area calculations
  CONTENT_WIDTH: 624,  // WIDTH - (MARGIN.LEFT + MARGIN.RIGHT)
  CONTENT_HEIGHT: 864  // HEIGHT - (MARGIN.TOP + MARGIN.BOTTOM)
};
```

## Phase 3: Type Safety (Week 3)

### 3.1 Add TypeScript Definitions
Create `src/types/` directory:
```typescript
// src/types/document.d.ts
export interface Page {
  pageNumber: number;
  content: string;
  elements: PageElement[];
}

export interface Document {
  pages: Page[];
  pageCount: number;
  timestamp: string;
  version: string;
  format: 'US Letter' | 'A4' | 'Legal';
  margins: string;
}

export interface ExportOptions {
  format: 'html' | 'markdown' | 'json' | 'pdf';
  includeStyles: boolean;
  embedImages: boolean;
}
```

### 3.2 Add Type Checking
```javascript
/**
 * @typedef {Object} PageConfig
 * @property {number} width - Page width in pixels
 * @property {number} height - Page height in pixels
 * @property {Object} margins - Page margins
 * @property {number} margins.top
 * @property {number} margins.right
 * @property {number} margins.bottom
 * @property {number} margins.left
 */

/**
 * @param {PageConfig} config - Page configuration
 * @returns {HTMLElement} Configured page element
 */
function createPageWithConfig(config) {
  // Type-safe implementation
}
```

## Phase 4: Testing Infrastructure (Week 4)

### 4.1 Set Up Testing Framework
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/dom": "^9.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

### 4.2 Create Test Structure
```
src/js/
├── core/
│   ├── PageManager.js
│   └── PageManager.test.js
├── components/
│   ├── TableOfContents.js
│   └── TableOfContents.test.js
```

### 4.3 Example Test
```javascript
// PageManager.test.js
import { PageManager } from './PageManager';

describe('PageManager', () => {
  let pageManager;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    pageManager = new PageManager(container);
  });

  describe('createPage()', () => {
    it('should create a new page with correct attributes', () => {
      const page = pageManager.createPage();
      
      expect(page.classList.contains('page')).toBe(true);
      expect(page.dataset.page).toBe('1');
      expect(pageManager.pages.length).toBe(1);
    });

    it('should increment page numbers correctly', () => {
      pageManager.createPage();
      const secondPage = pageManager.createPage();
      
      expect(secondPage.dataset.page).toBe('2');
    });
  });

  describe('checkOverflow()', () => {
    it('should detect content overflow', () => {
      const tallElement = document.createElement('div');
      tallElement.style.height = '2000px';
      
      expect(pageManager.checkOverflow(tallElement)).toBe(true);
    });
  });
});
```

## Phase 5: Build Process (Week 5)

### 5.1 Modern Build Setup
```javascript
// webpack.config.js
module.exports = {
  entry: './src/js/app.js',
  output: {
    filename: 'document-processor.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
```

### 5.2 Development Workflow
```json
// package.json
{
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## Phase 6: Error Handling & Logging

### 6.1 Structured Error System
```javascript
// src/utils/errors.js
export class DocumentError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends DocumentError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

export class ExportError extends DocumentError {
  constructor(message, format, reason) {
    super(message, 'EXPORT_ERROR', { format, reason });
    this.name = 'ExportError';
  }
}
```

### 6.2 Logging System
```javascript
// src/utils/logger.js
export class Logger {
  static log(level, message, data = {}) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      version: APP_VERSION
    };
    
    console[level](logEntry);
    
    // Future: Send to analytics
    if (window.analytics) {
      window.analytics.track('log_event', logEntry);
    }
  }
  
  static info(message, data) {
    this.log('info', message, data);
  }
  
  static error(message, error) {
    this.log('error', message, {
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code
    });
  }
}
```

## Implementation Timeline

### Week 1: Modularization
- Extract CSS into separate files
- Split JavaScript into modules
- Set up basic module structure

### Week 2: Documentation
- Add JSDoc comments
- Create component documentation
- Update README with new structure

### Week 3: Type Safety
- Add TypeScript definitions
- Implement type checking
- Create interfaces for data structures

### Week 4: Testing
- Set up Jest
- Write unit tests for core modules
- Achieve 80% code coverage

### Week 5: Build Process
- Configure Webpack
- Set up development server
- Create production build

### Week 6: Polish
- Implement error handling
- Add logging system
- Performance optimization

## Benefits After Refactoring

1. **LLM Comprehension**: Clear module boundaries and documentation
2. **Maintainability**: Easier to modify and extend
3. **Testing**: Comprehensive test coverage
4. **Type Safety**: Catch errors at development time
5. **Performance**: Optimized builds and lazy loading
6. **Developer Experience**: Modern tooling and workflows

## Next Steps

1. Create a new branch: `feature/llm-optimization`
2. Start with Phase 1 modularization
3. Test each phase thoroughly
4. Update documentation as you go
5. Create PR with detailed description