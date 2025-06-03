# Document Processor

A powerful, browser-based document processing tool that provides full control over text, images, and formatting with automatic pagination and US Letter format support.

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

## How to Use

1. **Open the Document Processor**
   ```bash
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

## Technical Details

### Page Specifications
- **Page Size**: US Letter (8.5" × 11")
- **Margins**: 1 inch on all sides
- **Content Area**: 6.5" × 9"
- **Font**: System fonts with 12pt default size
- **Line Height**: 1.6 for readability

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

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
  "version": "2.0",
  "format": "US Letter",
  "margins": "1 inch"
}
```

## Use Cases

- 📝 **Document Creation**: Write letters, reports, and articles
- 📊 **Data Reports**: Combine text, tables, and images
- 📚 **Multi-page Documents**: Automatic pagination for long content
- 🖨️ **Print-Ready Output**: Perfect for physical printing
- 💼 **Professional Documents**: Maintain standard formatting

## Development

This is a standalone HTML application with no external dependencies. All functionality is contained within a single HTML file using:
- Vanilla JavaScript
- CSS3 for styling
- HTML5 ContentEditable API
- Local Storage API
- File API for save/load

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

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

Created with ❤️ for seamless document processing