/**
 * @file PageManager.js
 * @description CRITICAL MODULE - Handles automatic pagination and page overflow
 * @module core/PageManager
 * @security Page dimensions must remain exact for US Letter format
 */

import { PAGE_CONFIG, SELECTORS, DEBOUNCE_DELAYS } from '../utils/Constants.js';
import { 
  getAllDocumentContainers, 
  showStatus, 
  createElement,
  debounce,
  findFirstTextNode,
  setCursorPosition
} from '../utils/DOMUtils.js';

/**
 * Manages document pagination and overflow handling
 * CRITICAL: This module maintains exact page dimensions and handles content overflow
 */
export class PageManager {
  constructor() {
    this.pageCount = 1;
    this.overflowTimeout = null;
    this.contentObserver = null;
    this.isProcessingOverflow = false;
    
    // Bind methods for global access
    this.checkPageOverflow = this.checkPageOverflow.bind(this);
    this.debouncedOverflowCheck = debounce(this.checkPageOverflow, DEBOUNCE_DELAYS.OVERFLOW_CHECK);
  }

  /**
   * Initialize page manager
   */
  initialize() {
    // Count existing pages
    this.pageCount = getAllDocumentContainers().length || 1;
    
    // Setup content monitoring
    this.setupContentMonitoring();
    
    // Setup input monitoring
    this.setupInputMonitoring();
    
    // Initial overflow check
    setTimeout(() => this.checkPageOverflow(), 100);
    
    // Make checkPageOverflow globally available for other modules
    window.checkPageOverflow = this.checkPageOverflow;
  }

  /**
   * Check if element should stay with next element (keep-with-next)
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Should keep with next
   */
  shouldKeepWithNext(element) {
    if (!element) return false;
    
    const tagName = element.tagName;
    const nextElement = element.nextElementSibling;
    
    if (!nextElement) return false;
    
    // Headings (H1-H6) should stay with following tables
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
      if (nextElement.tagName === 'TABLE') {
        return true;
      }
      // Also check for lists after headings
      if (['UL', 'OL'].includes(nextElement.tagName)) {
        return true;
      }
      // Check if next element is a paragraph that might contain important content
      if (nextElement.tagName === 'P' && nextElement.textContent.length < 100) {
        // Short paragraph after heading might be a caption
        const afterParagraph = nextElement.nextElementSibling;
        if (afterParagraph && afterParagraph.tagName === 'TABLE') {
          return true;
        }
      }
    }
    
    // Paragraphs ending with ":" often introduce tables/lists
    if (tagName === 'P' && element.textContent.trim().endsWith(':')) {
      if (['TABLE', 'UL', 'OL'].includes(nextElement.tagName)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all elements that should move together as a group
   * @param {HTMLElement} startElement - Starting element
   * @returns {HTMLElement[]} Group of elements
   */
  getKeepTogetherGroup(startElement) {
    const group = [startElement];
    let current = startElement;
    
    while (this.shouldKeepWithNext(current)) {
      current = current.nextElementSibling;
      if (current) {
        group.push(current);
      } else {
        break;
      }
    }
    
    return group;
  }

  /**
   * Check for page overflow and handle it
   * CRITICAL: This maintains exact page boundaries
   */
  checkPageOverflow() {
    if (this.isProcessingOverflow) return;
    this.isProcessingOverflow = true;
    
    try {
      const containers = getAllDocumentContainers();
      
      containers.forEach((container, index) => {
        const content = container.querySelector(SELECTORS.EDITABLE_CONTENT);
        if (!content) return;
        
        // Get the actual content height vs available height
        const availableHeight = content.clientHeight;
        const contentHeight = content.scrollHeight;
        
        // Check if content overflows
        if (contentHeight > availableHeight + 2) { // Small buffer for rounding errors
          this.handlePageOverflow(container, content, availableHeight, index);
        }
      });
    } finally {
      this.isProcessingOverflow = false;
    }
  }

  /**
   * Handle overflow for a specific page
   * @param {HTMLElement} container - Page container
   * @param {HTMLElement} content - Content element
   * @param {number} availableHeight - Available height
   * @param {number} pageIndex - Page index
   */
  handlePageOverflow(container, content, availableHeight, pageIndex) {
    // Create a temporary container to measure content
    const tempDiv = this.createMeasurementContainer(content);
    
    // Clone and measure each child
    const allNodes = Array.from(content.childNodes);
    let currentHeight = 0;
    let splitIndex = -1;
    
    for (let i = 0; i < allNodes.length; i++) {
      const clone = allNodes[i].cloneNode(true);
      tempDiv.appendChild(clone);
      
      const nodeHeight = tempDiv.scrollHeight - currentHeight;
      
      if (currentHeight + nodeHeight > availableHeight) {
        splitIndex = i;
        break;
      }
      currentHeight = tempDiv.scrollHeight;
    }
    
    // Clean up temp div
    document.body.removeChild(tempDiv);
    
    if (splitIndex >= 0) {
      this.splitContentAtIndex(container, content, allNodes, splitIndex);
    }
  }

  /**
   * Create temporary measurement container
   * @param {HTMLElement} content - Content to measure
   * @returns {HTMLElement} Temporary container
   */
  createMeasurementContainer(content) {
    const tempDiv = createElement('div', {
      style: {
        cssText: content.style.cssText,
        position: 'absolute',
        visibility: 'hidden',
        height: 'auto',
        width: content.clientWidth + 'px'
      }
    });
    document.body.appendChild(tempDiv);
    return tempDiv;
  }

  /**
   * Split content at specified index
   * @param {HTMLElement} container - Current page container
   * @param {HTMLElement} content - Current content
   * @param {Node[]} allNodes - All content nodes
   * @param {number} splitIndex - Index to split at
   */
  splitContentAtIndex(container, content, allNodes, splitIndex) {
    // Check if we're splitting a keep-together group
    let adjustedSplitIndex = this.adjustSplitForKeepTogether(allNodes, splitIndex);
    
    // Get or create next page
    let nextContainer = container.nextElementSibling;
    if (!nextContainer || !nextContainer.classList.contains('document-container')) {
      nextContainer = this.addNewPage();
    }
    
    const nextContent = nextContainer.querySelector(SELECTORS.EDITABLE_CONTENT);
    
    // Move overflowing content to next page
    this.moveContentToNextPage(allNodes, adjustedSplitIndex, nextContent);
    
    // Move cursor if needed
    this.handleCursorMovement(allNodes, adjustedSplitIndex, nextContent, nextContainer);
    
    // Recursively check the next page
    setTimeout(() => this.checkPageOverflow(), 100);
  }

  /**
   * Adjust split index for keep-together groups
   * @param {Node[]} allNodes - All nodes
   * @param {number} splitIndex - Original split index
   * @returns {number} Adjusted split index
   */
  adjustSplitForKeepTogether(allNodes, splitIndex) {
    let adjustedSplitIndex = splitIndex;
    
    // Look backward from split point to find keep-together groups
    for (let i = splitIndex - 1; i >= 0; i--) {
      const node = allNodes[i];
      if (node.nodeType === 1) { // Element node
        const group = this.getKeepTogetherGroup(node);
        // If this element is part of a group that extends past the split
        if (group.length > 1) {
          let groupEndIndex = i;
          for (let j = 0; j < group.length; j++) {
            const groupNode = group[j];
            const nodeIndex = allNodes.indexOf(groupNode);
            if (nodeIndex > groupEndIndex) {
              groupEndIndex = nodeIndex;
            }
          }
          // If group extends past or to the split point, move entire group
          if (groupEndIndex >= splitIndex) {
            adjustedSplitIndex = i;
            break;
          }
        }
      }
    }
    
    return adjustedSplitIndex;
  }

  /**
   * Move content to next page
   * @param {Node[]} allNodes - Nodes to move
   * @param {number} splitIndex - Index to split at
   * @param {HTMLElement} nextContent - Next page content area
   */
  moveContentToNextPage(allNodes, splitIndex, nextContent) {
    const nodesToMove = allNodes.slice(splitIndex);
    const fragment = document.createDocumentFragment();
    
    nodesToMove.forEach(node => {
      if (node.parentNode) {
        fragment.appendChild(node);
      }
    });
    
    // Clear placeholder text if exists
    if (nextContent.innerHTML.includes('Continue your content here')) {
      nextContent.innerHTML = '';
    }
    
    // Prepend to next page (in case it already has content)
    nextContent.insertBefore(fragment, nextContent.firstChild);
  }

  /**
   * Handle cursor movement after content split
   * @param {Node[]} nodesToMove - Nodes that were moved
   * @param {number} splitIndex - Split index
   * @param {HTMLElement} nextContent - Next page content
   * @param {HTMLElement} nextContainer - Next page container
   */
  handleCursorMovement(nodesToMove, splitIndex, nextContent, nextContainer) {
    if (nodesToMove.length > splitIndex) {
      // Focus the next page's content
      nextContent.focus();
      
      // Find first text node in the moved content
      const firstTextNode = findFirstTextNode(nextContent);
      
      if (firstTextNode) {
        setCursorPosition(firstTextNode, 0);
      } else {
        // If no text node, place at start of content
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(nextContent);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Scroll the new page into view
      nextContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Add a new page to the document
   * @param {boolean} focusNewPage - Whether to focus the new page
   * @returns {HTMLElement} New page container
   */
  addNewPage(focusNewPage = false) {
    this.pageCount++;
    const pageWrapper = document.querySelector(SELECTORS.PAGE_WRAPPER);
    
    const newPage = this.createNewPageElement();
    
    // Insert before the closing div of page-wrapper
    const lastPage = pageWrapper.querySelector('.document-container:last-of-type');
    lastPage.insertAdjacentElement('afterend', newPage);
    
    // Re-setup content monitoring for new page
    this.setupContentMonitoring();
    
    // Update any existing TOCs
    if (window.updateAllTOCs) {
      window.updateAllTOCs();
    }
    
    // Focus on new page if requested
    if (focusNewPage) {
      this.focusNewPage(newPage);
    }
    
    showStatus(`Added page ${this.pageCount}`);
    
    return newPage;
  }

  /**
   * Create new page element
   * @returns {HTMLElement} New page element
   */
  createNewPageElement() {
    const showMargins = document.querySelector('.show-margins') !== null;
    
    const newPage = createElement('div', {
      class: 'document-container' + (showMargins ? ' show-margins' : ''),
      id: `page-${this.pageCount}`
    });
    
    newPage.innerHTML = `
      <div class="margin-guides"></div>
      <div class="page-info">Page ${this.pageCount} | US Letter (8.5" × 11")</div>
      <div class="editable-content" contenteditable="true" style="height: ${PAGE_CONFIG.CONTENT_HEIGHT}; min-height: ${PAGE_CONFIG.CONTENT_HEIGHT}; max-height: ${PAGE_CONFIG.CONTENT_HEIGHT};">
      </div>
    `;
    
    // Copy exact styles from first page to ensure consistency
    this.copyPageStyles(newPage);
    
    return newPage;
  }

  /**
   * Copy styles from first page to new page
   * @param {HTMLElement} newPage - New page element
   */
  copyPageStyles(newPage) {
    const firstPage = document.getElementById('page-1');
    if (firstPage) {
      const firstContent = firstPage.querySelector(SELECTORS.EDITABLE_CONTENT);
      const newContent = newPage.querySelector(SELECTORS.EDITABLE_CONTENT);
      if (firstContent && newContent) {
        // Copy computed styles
        const computedStyle = window.getComputedStyle(firstContent);
        newContent.style.width = computedStyle.width;
        newContent.style.fontSize = computedStyle.fontSize;
        newContent.style.overflow = 'hidden';
      }
    }
  }

  /**
   * Focus on new page
   * @param {HTMLElement} newPage - Page to focus
   */
  focusNewPage(newPage) {
    const newContent = newPage.querySelector(SELECTORS.EDITABLE_CONTENT);
    if (newContent) {
      newContent.focus();
      // Place cursor at start
      setCursorPosition(newContent, 0);
      
      // Scroll to view
      newPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Setup content monitoring with MutationObserver
   */
  setupContentMonitoring() {
    // Disconnect existing observer if any
    if (this.contentObserver) {
      this.contentObserver.disconnect();
    }
    
    this.contentObserver = new MutationObserver((mutations) => {
      // Debounce overflow check
      this.debouncedOverflowCheck();
      
      // Update TOCs if needed
      if (window.updateAllTOCs) {
        window.updateAllTOCs();
      }
    });
    
    // Observe all editable content areas
    document.querySelectorAll(SELECTORS.EDITABLE_CONTENT).forEach(content => {
      this.contentObserver.observe(content, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  /**
   * Setup input monitoring for real-time page creation
   */
  setupInputMonitoring() {
    document.addEventListener('input', (e) => {
      if (e.target.closest(SELECTORS.EDITABLE_CONTENT)) {
        // Check for overflow more frequently during typing
        clearTimeout(this.overflowTimeout);
        this.overflowTimeout = setTimeout(() => {
          this.checkPageOverflow();
        }, DEBOUNCE_DELAYS.INPUT_CHECK);
      }
    });
  }

  /**
   * Get current page count
   * @returns {number} Number of pages
   */
  getPageCount() {
    return this.pageCount;
  }

  /**
   * Toggle margin guides visibility
   */
  toggleMargins() {
    const showMargins = document.querySelector('.show-margins') === null;
    document.querySelectorAll(SELECTORS.DOCUMENT_CONTAINER).forEach(container => {
      container.classList.toggle('show-margins', showMargins);
    });
    showStatus(showMargins ? 'Margin guides shown' : 'Margin guides hidden');
  }
}