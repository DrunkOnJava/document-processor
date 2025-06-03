# Document Processor

A modular, browser-based document processing system that provides US Letter format (8.5" × 11") documents with automatic pagination and rich text editing capabilities. Now featuring a clean, LLM-optimized architecture for enhanced maintainability and extensibility.

![Document Processor Screenshot](screenshot.png)

## Features

### 📄 True US Letter Format
- Exact 8.5" × 11" page dimensions
- Standard 1-inch margins on all sides
- Professional print-ready layout
- Visual page boundaries

### 🔄 Automatic Pagination
- Content automatically flows to new pages when needed
- No manual page breaks required
- Intelligent content splitting at element boundaries
- Maintains formatting across page breaks

### ✏️ Rich Text Editing
- **Text Formatting**: Bold, italic, underline
- **Headers**: H1, H2, H3 support
- **Lists**: Ordered and unordered
- **Quotes & Code**: Blockquotes and code blocks
- **Links**: Clickable hyperlinks
- **Text Alignment**: Left, center, and right alignment

### 📑 Table of Contents
- **Automatic Generation**: Creates TOC from all headings in document
- **Live Updates**: Automatically updates when headings change
- **Page Numbers**: Shows accurate page numbers for each heading
- **Click Navigation**: Click any TOC entry to jump to that section
- **Multi-level Support**: Handles H1, H2, and H3 headings with proper indentation
- **Smart Formatting**: Professional dotted lines between titles and page numbers

### 🖼️ Image Management
- Drag & drop image insertion
- Images embedded as base64 (no external dependencies)
- Resize controls (larger/smaller)
- Delete functionality
- Full control over placement

### 📊 Table Support
- Create tables with custom rows/columns
- Direct cell editing
- Professional formatting
- Maintains structure across pages

### 💾 Save & Export Options
- **JSON Format**: Complete document structure with all pages
- **HTML Export**: Standalone HTML files
- **Markdown Export**: Convert to Markdown format
- **Auto-save**: Every 30 seconds
- **Local Storage**: Persistent browser storage

### 🎨 Additional Features
- Toggle margin guides for precise layout
- Page numbering on each page
- Edit/View mode toggle
- Real-time content monitoring
- Print-optimized CSS (hides UI elements)

## 🛠️ Installation

### Quick Start (No Build Required)
1. Clone the repository
2. Open `src/index.html` in a modern web browser
3. Start creating documents!

### Development Setup
```bash
# Clone the repository
git clone https://github.com/DrunkOnJava/document-processor.git
cd document-processor

# Install dependencies
npm install

# Generate LLM context
npm run llm:init

# Start development (if webpack configured)
npm run dev
```

## How to Use

### For Users

1. **Open the Document Processor**
   ```bash
   # For the modular version
   open src/index.html
   
   # For the legacy monolithic version
   open document-processor.html
   ```

2. **Start Writing**
   - Click anywhere in the white page area
   - Start typing or paste content
   - Use the format buttons for styling

3. **Insert Images**
   - Click the 🖼️ Insert Image button
   - Select an image from your computer
   - Use the resize controls (+/-) as needed

4. **Create Tables**
   - Click the 📊 Insert Table button
   - Specify rows and columns
   - Click cells to edit content

5. **Save Your Work**
   - Click 💾 Save to download as JSON
   - Auto-saves every 30 seconds to browser storage
   - Load previous documents with 📁 Load

6. **Export Options**
   - 📤 Export HTML: Creates standalone HTML file
   - 📝 Export Markdown: Converts to Markdown format

## 📁 Project Structure

```
document-processor/
├── src/
│   ├── index.html          # Main HTML entry point
│   ├── js/
│   │   ├── index.js        # Application entry point
│   │   ├── core/           # Core modules (DocumentEngine, PageManager)
│   │   ├── components/     # UI components (ContentEditor, LineSpacing, TOC)
│   │   ├── utils/          # Utilities (Constants, DOMUtils, Storage)
│   │   └── export/         # Export modules (HTML, Markdown, JSON)
│   └── styles/             # Modular CSS files
├── scripts/
│   └── llm/                # LLM optimization tools
├── docs/                   # Documentation
└── tests/                  # Test suites
```

## 🏗️ Architecture

The project follows a modular architecture optimized for both human and AI comprehension:

- **DocumentEngine**: Central orchestrator coordinating all modules
- **PageManager**: Critical module handling pagination and overflow
- **ContentEditor**: Rich text editing functionality
- **LineSpacingManager**: Paragraph-level spacing control
- **StorageManager**: Document persistence and auto-save
- **ExportManager**: Multi-format export functionality

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed module descriptions.

## Technical Details

### Page Specifications
- **Page Size**: US Letter (8.5" × 11")
- **Margins**: 1 inch on all sides
- **Content Area**: 6.5" × 9"
- **Font**: System fonts with 12pt default size
- **Line Spacing**: Variable (1, 1.15, 1.5, 2, 2.5, 3)

### Browser Compatibility
- Chrome/Edge 90+ (recommended)
- Firefox 88+
- Safari 14+

### File Format
Documents are saved in JSON format with the following structure:
```json
{
  "pages": [
    {
      "pageNumber": 1,
      "content": "<p>HTML content...</p>"
    }
  ],
  "pageCount": 1,
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "3.0",
  "format": "US Letter",
  "margins": "1 inch",
  "defaultLineSpacing": 2
}
```

## Use Cases

- 📝 **Document Creation**: Write letters, reports, and articles
- 📊 **Data Reports**: Combine text, tables, and images
- 📚 **Multi-page Documents**: Automatic pagination for long content
- 🖨️ **Print-Ready Output**: Perfect for physical printing
- 💼 **Professional Documents**: Maintain standard formatting

## 🤖 LLM Optimization

This codebase is optimized for AI-assisted development:

- Files under 500 lines for optimal context windows
- Clear module boundaries and responsibilities
- Comprehensive JSDoc documentation
- Automated context generation (`npm run llm:generate`)
- Claude Code integration for AI-powered development

## 📝 Scripts

```bash
npm run llm:generate    # Generate LLM context
npm run llm:validate    # Validate code structure
npm run lint           # Run ESLint
npm run format         # Format with Prettier
npm test              # Run tests
npm run build         # Build for production
```

## Development

The modular architecture uses:
- Vanilla JavaScript with ES6 modules
- CSS3 split into logical files
- HTML5 ContentEditable API
- Local Storage API
- File API for save/load

### For Developers

The modular architecture makes it easy to extend:

```javascript
// Example: Adding a new feature
import { DocumentEngine } from './core/DocumentEngine.js';

// Create your module
class MyFeature {
  constructor() {
    // Initialize
  }
}

// Add to DocumentEngine
// See ARCHITECTURE.md for integration details
```

## Future Enhancements

- [ ] Page templates (letterhead, memo, etc.)
- [ ] Custom page sizes (A4, Legal, etc.)
- [ ] Header/Footer support
- [ ] Page numbering options
- [ ] PDF export functionality
- [ ] Collaborative editing
- [ ] Version history
- [ ] Custom fonts
- [ ] Advanced table editing
- [ ] Footnotes and endnotes

## License

MIT License - Feel free to use and modify for your needs.

## 🔄 Migration

Upgrading from the monolithic version? See [MIGRATION.md](MIGRATION.md) for a complete guide.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run `npm run llm:generate` before committing
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

**Note**: The original monolithic version is preserved as `document-processor.html` for reference.

Created with ❤️ for seamless document processing