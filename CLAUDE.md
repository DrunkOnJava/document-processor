# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev                # Start webpack dev server (if configured)
# OR simply open src/index.html in a browser (no build required)

# Testing
npm test                   # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format with Prettier
npm run typecheck         # TypeScript type checking

# LLM Context Management
npm run llm:init          # Generate and validate LLM context
npm run llm:generate      # Generate .llm-context file
npm run llm:validate      # Validate code structure

# Production Build
npm run build             # Build for production (webpack)
```

## Architecture Overview

The document processor is a modular system for creating US Letter format documents with automatic pagination. Originally a 1,759-line monolithic HTML file, it's now split into focused modules.

### Critical Architecture Decisions

1. **Exact Page Dimensions Must Be Preserved**
   - US Letter: 8.5" × 11" with 1" margins
   - Content area: 6.5" × 9"
   - These dimensions are hardcoded in `Constants.js` and must never change

2. **Module Communication Flow**
   ```
   DocumentEngine (orchestrator)
   ├── PageManager (CRITICAL - handles overflow/pagination)
   ├── ContentEditor (rich text editing)
   ├── LineSpacingManager (paragraph-level spacing)
   ├── TableOfContents (auto-generation)
   ├── StorageManager (persistence)
   └── ExportManager (multi-format export)
   ```

3. **PageManager is the Most Critical Module**
   - Monitors content overflow in real-time
   - Creates new pages automatically
   - Implements keep-with-next logic (headings stay with following content)
   - Uses MutationObserver for content monitoring
   - Debounces overflow checks for performance

4. **Global Functions for Backward Compatibility**
   - Toolbar onclick handlers are set up globally in `Toolbar.js`
   - Image resize/delete functions are global (set in `ContentEditor.js`)
   - TOC navigation function is global (set in `TableOfContents.js`)

5. **Document Format Versioning**
   - Current version: 3.0 (paragraph-level line spacing)
   - Must maintain compatibility with v2.0 and v3.0 formats
   - Version stored in saved JSON documents

### Key Technical Constraints

1. **No External Dependencies for Runtime**
   - Pure vanilla JavaScript with ES6 modules
   - No frameworks or libraries required
   - All functionality self-contained

2. **ContentEditable Quirks**
   - Different browsers handle contentEditable differently
   - Paste events need normalization (handled in `LineSpacingManager`)
   - Enter key creates new paragraphs that inherit spacing

3. **Performance Considerations**
   - Overflow checking is expensive - always debounced
   - DOM measurements use temporary hidden elements
   - MutationObserver configured for minimal overhead

### Module-Specific Notes

**PageManager.js**
- Contains keep-with-next logic for headings/tables
- Creates measurement container for overflow detection
- Handles cursor movement when content splits

**LineSpacingManager.js**
- Spacing applied per paragraph, not globally
- Uses CSS classes for standard spacings (1, 1.5, 2, etc.)
- Custom spacing uses inline styles

**StorageManager.js**
- Auto-saves every 30 seconds
- Exports trigger immediate download
- Legacy format detection for old documents

**ExportManager.js**
- Delegates to specific exporters (HTML, Markdown, JSON)
- Markdown export handles tables and TOC
- HTML export includes all styles inline

## Common Development Tasks

### Adding a New Feature
1. Create module in appropriate directory (`components/` or `utils/`)
2. Import and initialize in `DocumentEngine.js`
3. Add any global functions to appropriate setup method
4. Update `Constants.js` if new configuration needed

### Modifying Page Layout
⚠️ **CRITICAL**: Page dimensions are exact and must not change
- Edit CSS in `src/styles/page.css`
- Test print preview to ensure proper output
- Verify pagination still works correctly

### Adding Export Format
1. Create new exporter in `src/js/export/`
2. Add to `ExportManager.js`
3. Add toolbar button in `src/index.html`
4. Wire up in `Toolbar.js`

### Debugging Pagination Issues
1. Check `PageManager.checkPageOverflow()` method
2. Enable verbose logging in overflow detection
3. Verify content height calculations
4. Test with various line spacings

## Testing Considerations

- Pagination tests are critical - test various content types
- Line spacing inheritance needs edge case testing
- Export/import cycle must preserve all formatting
- Cross-browser testing essential for contentEditable