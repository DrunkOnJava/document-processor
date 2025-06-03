/**
 * @file ExportManager.js
 * @description Manages document export to various formats
 * @module export/ExportManager
 */

import { EXPORT_PREFIXES } from '../utils/Constants.js';
import { showStatus } from '../utils/DOMUtils.js';
import { HTMLExporter } from './HTMLExporter.js';
import { MarkdownExporter } from './MarkdownExporter.js';
import { JSONExporter } from './JSONExporter.js';

/**
 * Manages document export functionality
 */
export class ExportManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.htmlExporter = new HTMLExporter();
    this.markdownExporter = new MarkdownExporter();
    this.jsonExporter = new JSONExporter(storageManager);
  }

  /**
   * Export document as HTML
   * @returns {string} Download URL
   */
  exportAsHTML() {
    try {
      const htmlContent = this.htmlExporter.export();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      this.triggerDownload(url, `${EXPORT_PREFIXES.HTML}${Date.now()}.html`);
      showStatus('Exported as HTML!');
      
      return url;
    } catch (error) {
      console.error('HTML export failed:', error);
      showStatus('Export failed!');
      throw error;
    }
  }

  /**
   * Export document as Markdown
   * @returns {string} Download URL
   */
  exportAsMarkdown() {
    try {
      const markdownContent = this.markdownExporter.export();
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      this.triggerDownload(url, `${EXPORT_PREFIXES.MARKDOWN}${Date.now()}.md`);
      showStatus('Exported as Markdown!');
      
      return url;
    } catch (error) {
      console.error('Markdown export failed:', error);
      showStatus('Export failed!');
      throw error;
    }
  }

  /**
   * Export document as JSON
   * @param {number} currentLineSpacing - Current line spacing
   * @returns {string} Download URL
   */
  exportAsJSON(currentLineSpacing) {
    try {
      return this.jsonExporter.export(currentLineSpacing);
    } catch (error) {
      console.error('JSON export failed:', error);
      showStatus('Export failed!');
      throw error;
    }
  }

  /**
   * Trigger file download
   * @param {string} url - Blob URL
   * @param {string} filename - Download filename
   */
  triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    // Clean up blob URL after download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Import document from file
   * @param {File} file - File to import
   * @returns {Promise<Object>} Import result
   */
  async importDocument(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'json':
        return await this.storageManager.importFromJSON(file);
      
      case 'html':
        throw new Error('HTML import not yet implemented');
      
      case 'md':
      case 'markdown':
        throw new Error('Markdown import not yet implemented');
      
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }
}