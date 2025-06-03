/**
 * @file StorageManager.js
 * @description Handles document persistence and auto-save functionality
 * @module utils/StorageManager
 */

import { STORAGE_CONFIG, SELECTORS } from './Constants.js';
import { getAllDocumentContainers, getBlockElements, showStatus } from './DOMUtils.js';

/**
 * Storage manager for document persistence
 */
export class StorageManager {
  constructor() {
    this.autoSaveInterval = null;
    this.version = STORAGE_CONFIG.VERSION;
  }

  /**
   * Initialize auto-save functionality
   * @param {number} interval - Auto-save interval in milliseconds
   */
  initAutoSave(interval = STORAGE_CONFIG.AUTO_SAVE_INTERVAL) {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, interval);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Save document to localStorage
   * @param {number} currentLineSpacing - Current default line spacing
   * @returns {Object} Saved document object
   */
  saveToLocalStorage(currentLineSpacing = 2) {
    const pages = this.collectPages();
    
    const doc = {
      pages: pages,
      pageCount: pages.length,
      timestamp: new Date().toISOString(),
      version: this.version,
      format: 'US Letter',
      margins: '1 inch',
      defaultLineSpacing: currentLineSpacing
    };
    
    localStorage.setItem(STORAGE_CONFIG.STORAGE_KEY, JSON.stringify(doc));
    return doc;
  }

  /**
   * Collect all pages content
   * @returns {Array} Array of page objects
   */
  collectPages() {
    const pages = [];
    const containers = getAllDocumentContainers();
    
    containers.forEach((container, index) => {
      const content = container.querySelector(SELECTORS.EDITABLE_CONTENT);
      if (content) {
        // Ensure all spacing is saved as data attributes
        const blocks = getBlockElements(content);
        blocks.forEach(block => {
          const spacing = this.getSpacingFromElement(block);
          block.setAttribute('data-line-spacing', spacing);
        });
        
        pages.push({
          pageNumber: index + 1,
          content: content.innerHTML
        });
      }
    });
    
    return pages;
  }

  /**
   * Get spacing from element
   * @param {HTMLElement} element - Element to check
   * @returns {string} Spacing value
   */
  getSpacingFromElement(element) {
    // Check data attribute
    const dataSpacing = element.getAttribute('data-line-spacing');
    if (dataSpacing) return dataSpacing;
    
    // Check for spacing classes
    const spacingClasses = ['spacing-1', 'spacing-1-15', 'spacing-1-5', 'spacing-2', 'spacing-2-5', 'spacing-3'];
    for (const cls of spacingClasses) {
      if (element.classList.contains(cls)) {
        return cls.replace('spacing-', '').replace('-', '.');
      }
    }
    
    // Check inline style
    if (element.style.lineHeight && element.style.lineHeight !== 'normal') {
      return parseFloat(element.style.lineHeight).toString();
    }
    
    return '2'; // Default
  }

  /**
   * Load document from localStorage
   * @returns {Object|null} Loaded document or null
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Try legacy format
      const legacy = localStorage.getItem(STORAGE_CONFIG.LEGACY_KEY);
      if (legacy) {
        // Convert legacy format
        return {
          pages: [{ pageNumber: 1, content: legacy }],
          pageCount: 1,
          version: '1.0',
          defaultLineSpacing: 2
        };
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    
    return null;
  }

  /**
   * Export document to JSON file
   * @param {number} currentLineSpacing - Current default line spacing
   * @returns {string} Download URL
   */
  exportToJSON(currentLineSpacing = 2) {
    const doc = this.saveToLocalStorage(currentLineSpacing);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.json`;
    a.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showStatus(`Document saved! (${doc.pages.length} page${doc.pages.length > 1 ? 's' : ''})`);
    return url;
  }

  /**
   * Import document from JSON
   * @param {File} file - JSON file to import
   * @returns {Promise<Object>} Imported document
   */
  async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const doc = JSON.parse(e.target.result);
          
          // Validate document structure
          if (!this.validateDocument(doc)) {
            throw new Error('Invalid document format');
          }
          
          resolve(doc);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Validate document structure
   * @param {Object} doc - Document to validate
   * @returns {boolean} Valid or not
   */
  validateDocument(doc) {
    if (!doc || typeof doc !== 'object') return false;
    
    // Check for required fields
    if (!doc.pages || !Array.isArray(doc.pages)) return false;
    
    // Validate pages
    for (const page of doc.pages) {
      if (!page.content || typeof page.content !== 'string') return false;
      if (!page.pageNumber || typeof page.pageNumber !== 'number') return false;
    }
    
    // Check version compatibility
    const version = parseFloat(doc.version) || 1.0;
    if (version > parseFloat(this.version)) {
      console.warn('Document version is newer than current version');
    }
    
    return true;
  }

  /**
   * Clear all stored data
   */
  clearStorage() {
    localStorage.removeItem(STORAGE_CONFIG.STORAGE_KEY);
    localStorage.removeItem(STORAGE_CONFIG.LEGACY_KEY);
    showStatus('Storage cleared');
  }

  /**
   * Get storage size info
   * @returns {Object} Size information
   */
  getStorageInfo() {
    const stored = localStorage.getItem(STORAGE_CONFIG.STORAGE_KEY);
    if (!stored) return { size: 0, pages: 0 };
    
    const doc = JSON.parse(stored);
    return {
      size: new Blob([stored]).size,
      pages: doc.pages?.length || 0,
      version: doc.version,
      lastSaved: doc.timestamp
    };
  }
}