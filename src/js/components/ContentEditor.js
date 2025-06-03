/**
 * @file ContentEditor.js
 * @description Manages rich text editing functionality
 * @module components/ContentEditor
 */

import { SELECTORS } from '../utils/Constants.js';
import { showStatus, getCurrentRange } from '../utils/DOMUtils.js';

/**
 * Manages content editing and formatting commands
 */
export class ContentEditor {
  constructor(lineSpacingManager) {
    this.lineSpacingManager = lineSpacingManager;
    this.editMode = true;
  }

  /**
   * Initialize content editor
   */
  initialize() {
    this.setupEventListeners();
    this.setupPasteHandler();
    this.setupEnterKeyHandler();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Paste event handler
    document.addEventListener('paste', (e) => {
      if (!e.target.closest(SELECTORS.EDITABLE_CONTENT)) return;
      this.handlePaste(e);
    });

    // Enter key handler for paragraph inheritance
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.closest(SELECTORS.EDITABLE_CONTENT)) {
        this.lineSpacingManager.handleParagraphCreation(e);
      }
    });
  }

  /**
   * Setup paste event handler
   */
  setupPasteHandler() {
    // Additional paste handling is done in event listener
  }

  /**
   * Setup enter key handler
   */
  setupEnterKeyHandler() {
    // Additional enter key handling is done in event listener
  }

  /**
   * Handle paste events
   * @param {ClipboardEvent} event - Paste event
   */
  handlePaste(event) {
    const content = event.target.closest(SELECTORS.EDITABLE_CONTENT);
    
    setTimeout(() => {
      // Normalize paragraphs after paste
      this.lineSpacingManager.normalizeParagraphs(content);
      
      // Check page overflow after paste
      if (window.checkPageOverflow) {
        window.checkPageOverflow();
      }
      
      // Update toolbar
      this.lineSpacingManager.updateToolbarState();
    }, 100);
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode() {
    this.editMode = !this.editMode;
    const contents = document.querySelectorAll(SELECTORS.EDITABLE_CONTENT);
    contents.forEach(content => {
      content.contentEditable = this.editMode;
    });
    showStatus(this.editMode ? 'Edit mode enabled' : 'View mode enabled');
  }

  /**
   * Apply text formatting
   * @param {string} command - Format command
   */
  formatText(command) {
    switch(command) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
        
      case 'italic':
        document.execCommand('italic', false, null);
        break;
        
      case 'underline':
        document.execCommand('underline', false, null);
        break;
        
      case 'h1':
        document.execCommand('formatBlock', false, '<h1>');
        break;
        
      case 'h2':
        document.execCommand('formatBlock', false, '<h2>');
        break;
        
      case 'h3':
        document.execCommand('formatBlock', false, '<h3>');
        break;
        
      case 'ul':
        document.execCommand('insertUnorderedList', false, null);
        break;
        
      case 'ol':
        document.execCommand('insertOrderedList', false, null);
        break;
        
      case 'quote':
        document.execCommand('formatBlock', false, '<blockquote>');
        break;
        
      case 'code':
        document.execCommand('formatBlock', false, '<pre>');
        break;
        
      case 'link':
        this.insertLink();
        break;
    }
    
    // Update toolbar after formatting
    this.lineSpacingManager.updateToolbarState();
  }

  /**
   * Insert a link
   */
  insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  /**
   * Align text
   * @param {string} alignment - Alignment direction
   */
  alignText(alignment) {
    // Use execCommand for alignment
    switch(alignment) {
      case 'left':
        document.execCommand('justifyLeft', false, null);
        break;
        
      case 'center':
        document.execCommand('justifyCenter', false, null);
        break;
        
      case 'right':
        document.execCommand('justifyRight', false, null);
        break;
    }
    
    // Alternative method that works more reliably
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container = range.commonAncestorContainer;
      
      // Find the block-level parent element
      if (container.nodeType === 3) { // Text node
        container = container.parentNode;
      }
      
      // Find the nearest block element
      while (container && container !== document.body) {
        const tagName = container.tagName?.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'div', 'li', 'blockquote', 'pre'].includes(tagName)) {
          container.style.textAlign = alignment;
          break;
        }
        container = container.parentNode;
      }
    }
  }

  /**
   * Insert an image
   */
  insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = `<div class="image-container">
          <img src="${e.target.result}" alt="Inserted image">
          <div class="image-controls">
            <button onclick="resizeImage(this, 'smaller')">-</button>
            <button onclick="resizeImage(this, 'larger')">+</button>
            <button onclick="deleteImage(this)">×</button>
          </div>
        </div>`;
        document.execCommand('insertHTML', false, img);
        
        // Check for overflow after image insertion
        if (window.checkPageOverflow) {
          setTimeout(() => window.checkPageOverflow(), 100);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  /**
   * Insert a table
   */
  insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
      let table = '<table><tbody>';
      for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          table += i === 0 ? '<th>Header</th>' : '<td>Cell</td>';
        }
        table += '</tr>';
      }
      table += '</tbody></table>';
      document.execCommand('insertHTML', false, table);
      
      // Check for overflow after table insertion
      if (window.checkPageOverflow) {
        setTimeout(() => window.checkPageOverflow(), 100);
      }
    }
  }

  /**
   * Setup global functions for image controls
   */
  setupGlobalFunctions() {
    // These need to be global for onclick attributes
    window.resizeImage = (button, direction) => {
      const img = button.parentElement.parentElement.querySelector('img');
      const currentWidth = img.offsetWidth;
      const newWidth = direction === 'larger' ? currentWidth * 1.2 : currentWidth / 1.2;
      img.style.width = newWidth + 'px';
      
      // Check for overflow after resize
      if (window.checkPageOverflow) {
        setTimeout(() => window.checkPageOverflow(), 100);
      }
    };

    window.deleteImage = (button) => {
      button.parentElement.parentElement.remove();
      
      // Check for overflow after deletion
      if (window.checkPageOverflow) {
        setTimeout(() => window.checkPageOverflow(), 100);
      }
    };
  }

  /**
   * Initialize document with proper structure
   */
  initializeDocument() {
    document.querySelectorAll(SELECTORS.EDITABLE_CONTENT).forEach(content => {
      // Check if content is completely empty or just whitespace
      if (!content.innerHTML.trim() || content.innerHTML === '<br>') {
        // Create initial paragraph
        const p = document.createElement('p');
        p.setAttribute('data-line-spacing', this.lineSpacingManager.currentDefault.toString());
        
        const spacingClass = this.lineSpacingManager.spacingClasses[this.lineSpacingManager.currentDefault];
        if (spacingClass) {
          p.classList.add(spacingClass);
        } else {
          p.style.lineHeight = this.lineSpacingManager.currentDefault;
        }
        
        p.innerHTML = '<br>';
        content.innerHTML = '';
        content.appendChild(p);
      } else {
        // Normalize existing content
        this.lineSpacingManager.normalizeParagraphs(content);
      }
    });
  }

  /**
   * Get edit mode status
   * @returns {boolean} Edit mode status
   */
  isEditMode() {
    return this.editMode;
  }
}