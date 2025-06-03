/**
 * @file TableOfContents.js
 * @description Generates and manages table of contents
 * @module components/TableOfContents
 */

import { SELECTORS } from '../utils/Constants.js';
import { getAllDocumentContainers, showStatus } from '../utils/DOMUtils.js';

/**
 * Manages table of contents generation and updates
 */
export class TableOfContents {
  constructor() {
    this.headingSelectors = 'h1, h2, h3';
    this.tocIdPrefix = 'toc-';
    this.headingIdPrefix = 'heading-';
  }

  /**
   * Insert a new table of contents at cursor position
   */
  insertTOC() {
    // Create a unique ID for this TOC
    const tocId = this.tocIdPrefix + Date.now();
    
    const tocHTML = `
      <div class="table-of-contents" id="${tocId}" contenteditable="false">
        <h2>Table of Contents</h2>
        <div class="toc-content">
          <p style="text-align: center; color: #999;">Table of Contents will be generated here...</p>
        </div>
        <div class="toc-update-notice">Auto-updates when headings change</div>
      </div>
      <p><br></p>
    `;
    
    document.execCommand('insertHTML', false, tocHTML);
    
    // Update TOC immediately
    setTimeout(() => {
      this.updateAllTOCs();
    }, 100);
    
    showStatus('Table of Contents inserted!');
  }

  /**
   * Update all table of contents in the document
   */
  updateAllTOCs() {
    const tocs = document.querySelectorAll(SELECTORS.TABLE_OF_CONTENTS);
    tocs.forEach(toc => this.updateTOC(toc));
  }

  /**
   * Update a specific table of contents
   * @param {HTMLElement} tocElement - TOC element to update
   */
  updateTOC(tocElement) {
    // Collect all headings from all pages
    const headings = this.collectHeadings();
    
    // Generate TOC HTML
    const tocHTML = this.generateTOCHTML(headings);
    
    // Update the TOC content
    const tocContent = tocElement.querySelector(SELECTORS.TOC_CONTENT);
    if (tocContent) {
      tocContent.innerHTML = tocHTML;
    }
  }

  /**
   * Collect all headings from the document
   * @returns {Array} Array of heading objects
   */
  collectHeadings() {
    const headings = [];
    const containers = getAllDocumentContainers();
    
    containers.forEach((container, pageIndex) => {
      const pageNumber = pageIndex + 1;
      const content = container.querySelector(SELECTORS.EDITABLE_CONTENT);
      if (!content) return;
      
      // Find all headings
      const pageHeadings = content.querySelectorAll(this.headingSelectors);
      
      pageHeadings.forEach(heading => {
        // Skip if it's inside a TOC
        if (heading.closest(SELECTORS.TABLE_OF_CONTENTS)) return;
        
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent.trim();
        
        if (text) {
          // Create a unique ID for the heading if it doesn't have one
          if (!heading.id) {
            heading.id = this.generateHeadingId();
          }
          
          headings.push({
            level: level,
            text: text,
            id: heading.id,
            pageNumber: pageNumber
          });
        }
      });
    });
    
    return headings;
  }

  /**
   * Generate unique heading ID
   * @returns {string} Unique heading ID
   */
  generateHeadingId() {
    return this.headingIdPrefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate TOC HTML from headings
   * @param {Array} headings - Array of heading objects
   * @returns {string} Generated HTML
   */
  generateTOCHTML(headings) {
    if (headings.length === 0) {
      return '<p style="text-align: center; color: #999;">No headings found. Add headings (H1, H2, H3) to generate table of contents.</p>';
    }
    
    let tocHTML = '';
    
    headings.forEach(heading => {
      tocHTML += `
        <div class="toc-entry toc-level-${heading.level}">
          <span class="toc-title">
            <a href="#${heading.id}" class="toc-link" onclick="scrollToHeading('${heading.id}'); return false;">
              ${this.escapeHtml(heading.text)}
            </a>
          </span>
          <span class="toc-dots"></span>
          <span class="toc-page">${heading.pageNumber}</span>
        </div>
      `;
    });
    
    return tocHTML;
  }

  /**
   * Escape HTML for safe insertion
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Scroll to a heading
   * @param {string} headingId - ID of heading to scroll to
   */
  scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Highlight the heading briefly
      const originalBackground = heading.style.backgroundColor;
      heading.style.backgroundColor = '#ffeb3b';
      heading.style.transition = 'background-color 0.3s';
      
      setTimeout(() => {
        heading.style.backgroundColor = originalBackground;
      }, 2000);
    }
  }

  /**
   * Setup global function for TOC navigation
   * This is needed because onclick attributes can't access module methods
   */
  setupGlobalNavigation() {
    window.scrollToHeading = (headingId) => this.scrollToHeading(headingId);
  }

  /**
   * Check if content change affects TOC
   * @param {MutationRecord[]} mutations - DOM mutations
   * @returns {boolean} Whether TOC should update
   */
  shouldUpdateTOC(mutations) {
    return mutations.some(mutation => {
      // Check if heading was added/removed
      if (mutation.type === 'childList') {
        const hasHeading = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes))
          .some(node => {
            if (node.nodeType === 1) {
              return node.matches && node.matches(this.headingSelectors);
            }
            return false;
          });
        if (hasHeading) return true;
      }
      
      // Check if heading text changed
      if (mutation.type === 'characterData') {
        const parent = mutation.target.parentElement;
        if (parent && parent.matches && parent.matches(this.headingSelectors)) {
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Initialize TOC functionality
   */
  initialize() {
    this.setupGlobalNavigation();
    
    // Update existing TOCs
    this.updateAllTOCs();
  }
}