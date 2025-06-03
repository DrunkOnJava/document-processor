/**
 * @file JSONExporter.js
 * @description Exports document content to JSON format
 * @module export/JSONExporter
 */

/**
 * Handles JSON export functionality
 */
export class JSONExporter {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Export document as JSON
   * @param {number} currentLineSpacing - Current line spacing
   * @returns {string} Download URL
   */
  export(currentLineSpacing) {
    // Delegate to storage manager which already handles JSON export
    return this.storageManager.exportToJSON(currentLineSpacing);
  }
}