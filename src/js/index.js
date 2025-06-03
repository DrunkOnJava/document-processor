/**
 * @file index.js
 * @description Entry point for the document processor application
 * @module index
 */

// Import styles
import '../css/main.css';

// Import core modules
import { DocumentEngine } from './core/DocumentEngine.js';

// Global document engine instance
let documentEngine = null;

/**
 * Initialize the application when DOM is ready
 */
function initializeApp() {
  console.log('Document Processor starting...');
  
  // Create and initialize the document engine
  documentEngine = new DocumentEngine();
  documentEngine.initialize();
  
  // Make engine available globally for debugging
  window.documentEngine = documentEngine;
}

/**
 * Cleanup when page unloads
 */
function cleanupApp() {
  if (documentEngine) {
    documentEngine.destroy();
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupApp);

// Export for use in other modules if needed
export { documentEngine };