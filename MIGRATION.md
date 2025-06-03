# Document Processor Migration Guide

## From Monolithic to Modular Architecture

This guide explains how to migrate from the original monolithic `document-processor.html` to the new modular architecture.

## What's Changed

### Architecture Transformation
- **Before**: Single 1,759-line HTML file containing all HTML, CSS, and JavaScript
- **After**: Modular structure with 20+ files, each under 500 lines

### File Organization
```
Old Structure:
document-processor.html (everything)

New Structure:
src/
├── index.html           # HTML structure only
├── js/
│   ├── index.js        # Entry point
│   ├── core/           # Core modules
│   ├── components/     # UI components
│   ├── utils/          # Utilities
│   └── export/         # Export modules
└── styles/             # Separated CSS files
```

## Migration Steps

### 1. Backup Your Data
```bash
# Save any documents currently in the editor
# Export to JSON format for safest migration
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Use the New Version
- Open `src/index.html` in your browser
- Or set up a local development server:
```bash
npm run dev  # If webpack is configured
# Or use a simple HTTP server
python -m http.server 8000
```

### 4. Load Existing Documents
- The new version maintains **100% compatibility** with existing document formats
- Load your saved JSON files normally
- All formatting, pages, and content will be preserved

## Key Improvements

### 1. **Performance**
- Lazy loading of export modules
- Debounced overflow checking
- Optimized DOM operations

### 2. **Maintainability**
- Clear module boundaries
- Single responsibility principle
- Comprehensive documentation

### 3. **Extensibility**
- Easy to add new features
- Plugin-ready architecture
- Clear API boundaries

### 4. **Developer Experience**
- Hot module reloading (with webpack)
- Better debugging with source maps
- Automated testing support

## Feature Parity

All features from the original version are preserved:

✅ US Letter format (8.5" × 11") with 1-inch margins  
✅ Automatic pagination with overflow detection  
✅ Rich text editing (bold, italic, underline, etc.)  
✅ Multiple line spacing options (1, 1.15, 1.5, 2, 2.5, 3)  
✅ Text alignment (left, center, right)  
✅ Table of Contents generation  
✅ Image insertion and management  
✅ Table creation and editing  
✅ Export to JSON/HTML/Markdown  
✅ Auto-save every 30 seconds  
✅ Keep-with-next for headings  

## Breaking Changes

### For End Users
- **None!** The user interface remains identical

### For Developers
- Global functions are now namespaced in modules
- Direct DOM manipulation should use DOMUtils
- All constants moved to Constants.js
- CSS classes remain the same for compatibility

## Customization

### Adding New Features
1. Create a new module in the appropriate directory
2. Import and initialize in DocumentEngine
3. Follow the established patterns

Example:
```javascript
// src/js/components/SpellChecker.js
export class SpellChecker {
  constructor() {
    // Initialize spell checker
  }
  
  checkSpelling() {
    // Implementation
  }
}
```

### Modifying Styles
- Edit the appropriate CSS file in `src/styles/`
- `base.css` - General styles
- `page.css` - Page layout
- `editor.css` - Editor interface
- `print.css` - Print styles

## Troubleshooting

### Issue: Module Loading Errors
**Solution**: Ensure you're using a web server, not file:// protocol

### Issue: Styles Not Loading
**Solution**: Check that all CSS files are linked in index.html

### Issue: Functions Not Working
**Solution**: The toolbar functions are set up in Toolbar.js - check browser console for errors

## Development Workflow

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Generating LLM Context
```bash
npm run llm:generate
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Review ARCHITECTURE.md for module details
3. Create an issue on GitHub

## Future Enhancements

The modular architecture enables:
- Collaborative editing
- Cloud storage integration
- PDF export
- Custom templates
- Spell checking
- Track changes
- Version control

---

**Note**: The original `document-processor.html` file is preserved for reference and fallback.