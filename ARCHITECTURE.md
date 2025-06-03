# Document Processor Architecture

## Overview

The Document Processor is a browser-based document editing tool that provides rich text editing capabilities with automatic pagination, maintaining exact US Letter format (8.5" × 11") with 1-inch margins.

## Core Modules

### 1. DocumentEngine (`src/js/core/DocumentEngine.js`)
Central orchestrator that coordinates all other modules.

**Responsibilities:**
- Initialize and manage all subsystems
- Handle global state management
- Coordinate inter-module communication
- Manage toolbar interactions

### 2. PageManager (`src/js/core/PageManager.js`)
**CRITICAL MODULE** - Handles automatic pagination and page overflow.

**Responsibilities:**
- Monitor content overflow in real-time
- Create new pages when needed
- Manage page dimensions (8.5" × 11")
- Handle keep-with-next logic for headings
- Maintain exact page boundaries

### 3. ContentEditor (`src/js/components/ContentEditor.js`)
Manages rich text editing functionality.

**Responsibilities:**
- Handle contentEditable interactions
- Manage text formatting (bold, italic, etc.)
- Process keyboard shortcuts
- Handle paste events and normalization

### 4. LineSpacingManager (`src/js/components/LineSpacingManager.js`)
Controls paragraph-level line spacing.

**Responsibilities:**
- Apply spacing to individual paragraphs
- Inherit spacing for new paragraphs
- Manage spacing CSS classes
- Update toolbar state

### 5. TableOfContents (`src/js/components/TableOfContents.js`)
Generates and updates table of contents.

**Responsibilities:**
- Scan all pages for headings
- Generate TOC entries with page numbers
- Handle navigation to headings
- Auto-update on content changes

### 6. ExportManager (`src/js/export/ExportManager.js`)
Handles document export to various formats.

**Responsibilities:**
- Export to JSON (with full formatting)
- Export to HTML
- Export to Markdown
- Maintain format compatibility

### 7. StorageManager (`src/js/utils/StorageManager.js`)
Manages local storage and auto-save.

**Responsibilities:**
- Auto-save every 30 seconds
- Save/load document state
- Maintain backward compatibility
- Handle multi-page documents

## Critical Constraints

1. **Page Dimensions**: Must maintain exact US Letter format (8.5" × 11")
2. **Margins**: Exactly 1 inch on all sides
3. **Pagination**: Automatic overflow handling is core functionality
4. **Compatibility**: Must maintain backward compatibility with v2.0 and v3.0 document formats

## Data Flow

```
User Input → ContentEditor → DocumentEngine → PageManager
                ↓                               ↓
           LineSpacing                    Check Overflow
                ↓                               ↓
           Update DOM                    Create New Page
                ↓                               ↓
           StorageManager               Update TOC
                ↓
           Auto-save
```

## File Structure

```
src/
├── js/
│   ├── core/
│   │   ├── DocumentEngine.js      # Main orchestrator
│   │   └── PageManager.js         # Pagination logic
│   ├── components/
│   │   ├── ContentEditor.js       # Rich text editing
│   │   ├── LineSpacingManager.js  # Line spacing control
│   │   ├── TableOfContents.js     # TOC generation
│   │   └── Toolbar.js             # Toolbar interactions
│   ├── utils/
│   │   ├── StorageManager.js      # Local storage
│   │   ├── DOMUtils.js            # DOM helpers
│   │   └── Constants.js           # Global constants
│   └── export/
│       ├── ExportManager.js       # Export orchestrator
│       ├── HTMLExporter.js        # HTML export
│       ├── MarkdownExporter.js    # Markdown export
│       └── JSONExporter.js        # JSON export
├── styles/
│   ├── base.css                   # Core styles
│   ├── page.css                   # Page layout
│   ├── editor.css                 # Editor styles
│   └── print.css                  # Print styles
└── index.html                     # Entry point
```

## Performance Considerations

- Debounced overflow checking (100ms)
- MutationObserver for content changes
- Efficient DOM manipulation
- Lazy loading for export modules

## Security Considerations

- Sanitize pasted content
- Validate loaded documents
- Safe innerHTML usage
- XSS prevention in exports