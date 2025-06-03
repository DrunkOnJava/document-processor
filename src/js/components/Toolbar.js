/**
 * @file Toolbar.js
 * @description Manages toolbar interactions and button handlers
 * @module components/Toolbar
 */

/**
 * Manages toolbar functionality
 */
export class Toolbar {
  constructor(contentEditor, pageManager, tableOfContents, exportManager, storageManager, lineSpacingManager) {
    this.contentEditor = contentEditor;
    this.pageManager = pageManager;
    this.tableOfContents = tableOfContents;
    this.exportManager = exportManager;
    this.storageManager = storageManager;
    this.lineSpacingManager = lineSpacingManager;
  }

  /**
   * Initialize toolbar
   */
  initialize() {
    this.setupEventHandlers();
    this.setupGlobalFunctions();
  }

  /**
   * Setup event handlers for toolbar buttons
   */
  setupEventHandlers() {
    // File operations
    this.bindButton('saveDocument', () => this.saveDocument());
    this.bindButton('loadDocument', () => this.loadDocument());
    
    // Export operations
    this.bindButton('exportAsHTML', () => this.exportManager.exportAsHTML());
    this.bindButton('exportAsMarkdown', () => this.exportManager.exportAsMarkdown());
    this.bindButton('exportAsJSON', () => this.exportManager.exportAsJSON(this.lineSpacingManager.currentDefault));
    
    // Insert operations
    this.bindButton('insertImage', () => this.contentEditor.insertImage());
    this.bindButton('insertTable', () => this.contentEditor.insertTable());
    this.bindButton('insertTOC', () => this.tableOfContents.insertTOC());
    
    // View operations
    this.bindButton('toggleEditMode', () => this.contentEditor.toggleEditMode());
    this.bindButton('toggleMargins', () => this.pageManager.toggleMargins());
    this.bindButton('addNewPage', () => this.pageManager.addNewPage(true));
    
    // Format operations
    this.setupFormatButtons();
    
    // Line spacing
    this.setupLineSpacingDropdown();
  }

  /**
   * Bind button click handler
   * @param {string} buttonId - Button function name
   * @param {Function} handler - Click handler
   */
  bindButton(buttonId, handler) {
    // Find button by onclick attribute
    const button = document.querySelector(`button[onclick="${buttonId}()"]`);
    if (button) {
      button.onclick = handler;
    }
  }

  /**
   * Setup format buttons
   */
  setupFormatButtons() {
    const formatCommands = ['bold', 'italic', 'underline', 'h1', 'h2', 'h3', 'ul', 'ol', 'quote', 'code', 'link'];
    
    formatCommands.forEach(command => {
      const button = document.querySelector(`button[onclick="formatText('${command}')"]`);
      if (button) {
        button.onclick = () => this.contentEditor.formatText(command);
      }
    });
    
    // Alignment buttons
    ['left', 'center', 'right'].forEach(alignment => {
      const button = document.querySelector(`button[onclick="alignText('${alignment}')"]`);
      if (button) {
        button.onclick = () => this.contentEditor.alignText(alignment);
      }
    });
  }

  /**
   * Setup line spacing dropdown
   */
  setupLineSpacingDropdown() {
    const select = document.getElementById('lineSpacingSelect');
    if (select) {
      select.onchange = (e) => this.lineSpacingManager.setLineSpacing(e.target.value);
    }
  }

  /**
   * Setup global functions needed by toolbar
   */
  setupGlobalFunctions() {
    // These need to be global for existing onclick attributes
    window.saveDocument = () => this.saveDocument();
    window.loadDocument = () => this.loadDocument();
    window.exportAsHTML = () => this.exportManager.exportAsHTML();
    window.exportAsMarkdown = () => this.exportManager.exportAsMarkdown();
    window.insertImage = () => this.contentEditor.insertImage();
    window.insertTable = () => this.contentEditor.insertTable();
    window.insertTOC = () => this.tableOfContents.insertTOC();
    window.toggleEditMode = () => this.contentEditor.toggleEditMode();
    window.toggleMargins = () => this.pageManager.toggleMargins();
    window.addNewPage = () => this.pageManager.addNewPage(true);
    window.formatText = (cmd) => this.contentEditor.formatText(cmd);
    window.alignText = (align) => this.contentEditor.alignText(align);
    window.setLineSpacing = (spacing) => this.lineSpacingManager.setLineSpacing(spacing);
  }

  /**
   * Save document
   */
  saveDocument() {
    this.storageManager.exportToJSON(this.lineSpacingManager.currentDefault);
  }

  /**
   * Load document
   */
  loadDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      try {
        const doc = await this.storageManager.importFromJSON(file);
        this.loadDocumentData(doc);
      } catch (error) {
        console.error('Failed to load document:', error);
        showStatus('Failed to load document!');
      }
    };
    input.click();
  }

  /**
   * Load document data into editor
   * @param {Object} doc - Document data
   */
  loadDocumentData(doc) {
    // Clear existing pages except the first one
    const containers = document.querySelectorAll('.document-container');
    for (let i = containers.length - 1; i > 0; i--) {
      containers[i].remove();
    }
    this.pageManager.pageCount = 1;
    
    if ((doc.version === '2.0' || doc.version === '3.0') && doc.pages) {
      // Load default line spacing if available
      if (doc.defaultLineSpacing || doc.lineSpacing) {
        this.lineSpacingManager.currentDefault = doc.defaultLineSpacing || doc.lineSpacing;
        // Update the dropdown
        const spacingSelect = document.getElementById('lineSpacingSelect');
        if (spacingSelect) {
          spacingSelect.value = this.lineSpacingManager.currentDefault;
        }
      }
      
      // Load multi-page document
      document.getElementById('document-content').innerHTML = doc.pages[0].content;
      
      // Create additional pages
      for (let i = 1; i < doc.pages.length; i++) {
        this.pageManager.addNewPage();
        const newContainers = document.querySelectorAll('.document-container');
        const content = newContainers[i].querySelector('.editable-content');
        if (content) {
          content.innerHTML = doc.pages[i].content;
        }
      }
      
      // Restore paragraph spacing from data attributes
      document.querySelectorAll('.editable-content').forEach(content => {
        this.restoreParagraphSpacing(content, doc.version);
      });
      
      showStatus(`Document loaded! (${doc.pages.length} pages)`);
    } else if (doc.content) {
      // Load old single-page format
      document.getElementById('document-content').innerHTML = doc.content;
      showStatus('Document loaded! (Legacy format)');
    }
    
    // Re-setup monitoring
    setTimeout(() => {
      this.pageManager.setupContentMonitoring();
      this.pageManager.checkPageOverflow();
      this.tableOfContents.updateAllTOCs();
    }, 100);
  }

  /**
   * Restore paragraph spacing after loading
   * @param {HTMLElement} content - Content element
   * @param {string} version - Document version
   */
  restoreParagraphSpacing(content, version) {
    const blocks = this.lineSpacingManager.getBlockElements(content);
    blocks.forEach(block => {
      const spacing = block.getAttribute('data-line-spacing');
      if (spacing) {
        this.lineSpacingManager.applySpacingToParagraph(block, spacing);
      } else if (version === '2.0') {
        // Legacy documents - apply default spacing
        this.lineSpacingManager.applySpacingToParagraph(block, this.lineSpacingManager.currentDefault.toString());
      }
    });
  }
}