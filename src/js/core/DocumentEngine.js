/**
 * @file DocumentEngine.js
 * @description Core orchestrator for the document processor
 * @module core/DocumentEngine
 */

import { StorageManager } from '../utils/StorageManager.js';
import { PageManager } from './PageManager.js';
import { ContentEditor } from '../components/ContentEditor.js';
import { LineSpacingManager } from '../components/LineSpacingManager.js';
import { TableOfContents } from '../components/TableOfContents.js';
import { Toolbar } from '../components/Toolbar.js';
import { ExportManager } from '../export/ExportManager.js';
import { STORAGE_CONFIG } from '../utils/Constants.js';

/**
 * Main document processor engine that coordinates all modules
 */
export class DocumentEngine {
  constructor() {
    // Initialize all managers
    this.storageManager = new StorageManager();
    this.pageManager = new PageManager();
    this.lineSpacingManager = new LineSpacingManager();
    this.contentEditor = new ContentEditor(this.lineSpacingManager);
    this.tableOfContents = new TableOfContents();
    this.exportManager = new ExportManager(this.storageManager);
    this.toolbar = new Toolbar(
      this.contentEditor,
      this.pageManager,
      this.tableOfContents,
      this.exportManager,
      this.storageManager,
      this.lineSpacingManager
    );
  }

  /**
   * Initialize the document processor
   */
  initialize() {
    console.log('Initializing Document Processor...');
    
    // Initialize all components
    this.pageManager.initialize();
    this.lineSpacingManager.initialize();
    this.contentEditor.initialize();
    this.tableOfContents.initialize();
    this.toolbar.initialize();
    
    // Setup global functions needed by components
    this.setupGlobalFunctions();
    
    // Load saved document if exists
    this.loadAutoSave();
    
    // Initialize document structure
    this.contentEditor.initializeDocument();
    
    // Setup auto-save
    this.storageManager.initAutoSave();
    
    // Initial page overflow check
    setTimeout(() => {
      this.pageManager.checkPageOverflow();
      this.tableOfContents.updateAllTOCs();
    }, 500);
    
    console.log('Document Processor initialized successfully!');
  }

  /**
   * Setup global functions for backward compatibility
   */
  setupGlobalFunctions() {
    // Content editor functions
    this.contentEditor.setupGlobalFunctions();
    
    // Table of contents navigation
    this.tableOfContents.setupGlobalNavigation();
    
    // Make updateAllTOCs globally available
    window.updateAllTOCs = () => this.tableOfContents.updateAllTOCs();
  }

  /**
   * Load auto-saved document on startup
   */
  loadAutoSave() {
    const doc = this.storageManager.loadFromLocalStorage();
    
    if (doc) {
      this.toolbar.loadDocumentData(doc);
    } else {
      // Check for legacy autosave
      const legacyContent = localStorage.getItem(STORAGE_CONFIG.LEGACY_KEY);
      if (legacyContent) {
        document.getElementById('document-content').innerHTML = legacyContent;
      }
    }
  }

  /**
   * Get current document state
   * @returns {Object} Document state
   */
  getDocumentState() {
    return {
      pageCount: this.pageManager.getPageCount(),
      editMode: this.contentEditor.isEditMode(),
      lineSpacing: this.lineSpacingManager.currentDefault,
      storageInfo: this.storageManager.getStorageInfo()
    };
  }

  /**
   * Clear all content and reset to single page
   */
  clearDocument() {
    // Clear storage
    this.storageManager.clearStorage();
    
    // Reset to single page
    const containers = document.querySelectorAll('.document-container');
    for (let i = containers.length - 1; i > 0; i--) {
      containers[i].remove();
    }
    
    // Clear first page content
    const firstContent = document.getElementById('document-content');
    if (firstContent) {
      firstContent.innerHTML = '';
      this.contentEditor.initializeDocument();
    }
    
    // Reset page count
    this.pageManager.pageCount = 1;
    
    // Update TOCs
    this.tableOfContents.updateAllTOCs();
  }

  /**
   * Destroy the document engine and cleanup
   */
  destroy() {
    // Stop auto-save
    this.storageManager.stopAutoSave();
    
    // Disconnect observers
    if (this.pageManager.contentObserver) {
      this.pageManager.contentObserver.disconnect();
    }
    
    console.log('Document Processor destroyed');
  }
}