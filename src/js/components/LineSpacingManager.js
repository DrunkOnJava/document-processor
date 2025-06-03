/**
 * @file LineSpacingManager.js
 * @description Manages paragraph-level line spacing control
 * @module components/LineSpacingManager
 */

import { SPACING_CONFIG, SELECTORS, SHORTCUTS } from '../utils/Constants.js';
import { 
  getContainingParagraph, 
  getBlockElements, 
  showStatus,
  getCurrentRange
} from '../utils/DOMUtils.js';

/**
 * Manages line spacing for document paragraphs
 */
export class LineSpacingManager {
  constructor() {
    this.currentDefault = SPACING_CONFIG.DEFAULT;
    this.spacingClasses = Object.fromEntries(
      Object.entries(SPACING_CONFIG.OPTIONS).map(([value, config]) => [value, config.class])
    );
  }

  /**
   * Initialize line spacing manager
   * @param {number} defaultSpacing - Default line spacing value
   */
  initialize(defaultSpacing = SPACING_CONFIG.DEFAULT) {
    this.currentDefault = defaultSpacing;
    this.setupEventListeners();
    this.updateToolbarState();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toolbar state updates
    document.addEventListener('selectionchange', () => this.debouncedToolbarUpdate());
    document.addEventListener('click', (e) => {
      if (e.target.closest(SELECTORS.EDITABLE_CONTENT)) {
        this.debouncedToolbarUpdate();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keyup', (e) => {
      if (e.target.closest(SELECTORS.EDITABLE_CONTENT)) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
             'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
          this.debouncedToolbarUpdate();
        }
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.closest(SELECTORS.EDITABLE_CONTENT) && 
          (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const shortcut = Object.values(SHORTCUTS.LINE_SPACING).find(s => s.key === e.key);
        if (shortcut) {
          e.preventDefault();
          this.setLineSpacing(shortcut.spacing);
        }
      }
    });
  }

  /**
   * Debounced toolbar update
   */
  debouncedToolbarUpdate = (() => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.updateToolbarState(), 50);
    };
  })();

  /**
   * Get paragraphs from current selection
   * @returns {HTMLElement[]} Selected paragraphs
   */
  getParagraphsFromSelection() {
    const selection = window.getSelection();
    const paragraphs = new Set();
    
    if (selection.rangeCount === 0) return [];
    
    const range = selection.getRangeAt(0);
    
    // If collapsed (no selection), get current paragraph
    if (range.collapsed) {
      const para = getContainingParagraph(range.commonAncestorContainer);
      if (para) paragraphs.add(para);
    } else {
      // Get all paragraphs in the selection range
      const container = range.commonAncestorContainer;
      const rootElement = container.nodeType === 1 ? container : container.parentElement;
      
      // Find the closest editable content
      const editableContent = rootElement.closest(SELECTORS.EDITABLE_CONTENT) || 
                             rootElement.querySelector(SELECTORS.EDITABLE_CONTENT);
      if (editableContent) {
        const blocks = getBlockElements(editableContent);
        
        blocks.forEach(block => {
          // Check if block is at least partially in selection
          if (selection.containsNode(block, true)) {
            paragraphs.add(block);
          }
        });
      }
    }
    
    return Array.from(paragraphs);
  }

  /**
   * Apply spacing to a paragraph
   * @param {HTMLElement} element - Element to apply spacing to
   * @param {string} spacing - Spacing value
   */
  applySpacingToParagraph(element, spacing) {
    // Remove all spacing classes first
    Object.values(this.spacingClasses).forEach(className => {
      element.classList.remove(className);
    });
    
    // Remove inline line-height style
    element.style.lineHeight = '';
    
    // Apply new spacing
    if (this.spacingClasses[spacing]) {
      element.classList.add(this.spacingClasses[spacing]);
      element.setAttribute('data-line-spacing', spacing);
    } else {
      // Custom spacing - use inline style
      element.style.lineHeight = spacing;
      element.setAttribute('data-line-spacing', spacing);
    }
  }

  /**
   * Get spacing from paragraph
   * @param {HTMLElement} element - Element to check
   * @returns {number} Spacing value
   */
  getSpacingFromParagraph(element) {
    // First check data attribute
    const dataSpacing = element.getAttribute('data-line-spacing');
    if (dataSpacing) return parseFloat(dataSpacing);
    
    // Then check for spacing classes
    for (const [value, className] of Object.entries(this.spacingClasses)) {
      if (element.classList.contains(className)) {
        return parseFloat(value);
      }
    }
    
    // Check inline style
    if (element.style.lineHeight && element.style.lineHeight !== 'normal') {
      return parseFloat(element.style.lineHeight);
    }
    
    // Default to document default
    return this.currentDefault;
  }

  /**
   * Set line spacing for selected paragraphs
   * @param {string} spacing - Spacing value to apply
   */
  setLineSpacing(spacing) {
    const paragraphs = this.getParagraphsFromSelection();
    
    if (paragraphs.length === 0) {
      // No valid paragraphs found, possibly in empty content
      const activeElement = document.activeElement;
      const content = activeElement && activeElement.closest(SELECTORS.EDITABLE_CONTENT);
      if (content) {
        // Ensure content has at least one paragraph
        if (!content.querySelector('p, h1, h2, h3, h4, h5, h6, li, blockquote')) {
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          content.appendChild(p);
          paragraphs.push(p);
          
          // Move cursor to new paragraph
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(p);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    
    // Apply spacing to all affected paragraphs
    paragraphs.forEach(para => {
      this.applySpacingToParagraph(para, spacing);
    });
    
    // Update current default for new paragraphs
    this.currentDefault = parseFloat(spacing);
    
    // Update the toolbar display
    this.updateToolbarState();
    
    // Check for overflow after spacing change
    if (window.checkPageOverflow) {
      setTimeout(() => window.checkPageOverflow(), 100);
    }
    
    // Show status
    const label = this.getSpacingLabel(spacing);
    showStatus(`Line spacing set to ${label}`);
  }

  /**
   * Update toolbar state to reflect current spacing
   */
  updateToolbarState() {
    const paragraphs = this.getParagraphsFromSelection();
    const spacingSelect = document.querySelector(SELECTORS.LINE_SPACING_SELECT);
    
    if (!spacingSelect) return;
    
    // Reset all option labels first
    Array.from(spacingSelect.options).forEach(option => {
      const baseText = option.text.split(' (')[0];
      option.text = baseText;
    });
    
    if (paragraphs.length === 0) {
      // No paragraphs selected, show document default
      spacingSelect.value = this.currentDefault.toString();
      return;
    }
    
    // Get all unique spacings in selection
    const spacings = new Set();
    paragraphs.forEach(para => {
      const spacing = this.getSpacingFromParagraph(para);
      spacings.add(spacing);
    });
    
    if (spacings.size === 1) {
      // All paragraphs have same spacing
      const spacing = Array.from(spacings)[0];
      
      // Find closest option
      let closestOption = null;
      let closestDiff = Infinity;
      
      Array.from(spacingSelect.options).forEach(option => {
        const optionValue = parseFloat(option.value);
        const diff = Math.abs(optionValue - spacing);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestOption = option;
        }
      });
      
      if (closestOption) {
        spacingSelect.value = closestOption.value;
        
        // Show actual value if different
        if (Math.abs(parseFloat(closestOption.value) - spacing) > 0.01) {
          const baseText = closestOption.text.split(' (')[0];
          closestOption.text = `${baseText} (${spacing.toFixed(2)})`;
        }
      }
    } else {
      // Mixed spacing - show indicator
      const currentOption = Array.from(spacingSelect.options).find(
        opt => opt.value === spacingSelect.value
      );
      if (currentOption) {
        const baseText = currentOption.text.split(' (')[0];
        currentOption.text = `${baseText} (Mixed)`;
      }
    }
  }

  /**
   * Get readable label for spacing value
   * @param {string} spacing - Spacing value
   * @returns {string} Readable label
   */
  getSpacingLabel(spacing) {
    const config = SPACING_CONFIG.OPTIONS[spacing];
    return config ? config.label.toLowerCase() : `${spacing}x`;
  }

  /**
   * Handle paragraph creation on Enter key
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleParagraphCreation(event) {
    if (event.key !== 'Enter') return;
    
    // Get the current paragraph before the split
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const currentPara = getContainingParagraph(selection.focusNode);
    if (!currentPara) return;
    
    const currentSpacing = this.getSpacingFromParagraph(currentPara);
    
    // Wait for browser to create new paragraph
    setTimeout(() => {
      const newSelection = window.getSelection();
      if (newSelection.rangeCount === 0) return;
      
      const newPara = getContainingParagraph(newSelection.focusNode);
      if (newPara && newPara !== currentPara) {
        // Apply same spacing to new paragraph
        this.applySpacingToParagraph(newPara, currentSpacing.toString());
      }
    }, 10);
  }

  /**
   * Normalize paragraphs after paste
   * @param {HTMLElement} container - Container element
   */
  normalizeParagraphs(container) {
    // Find all text nodes that are direct children of content area
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_SKIP;
          }
          
          const parent = node.parentElement;
          const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'TD', 'TH'];
          
          if (parent === container || !blockTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Wrap loose text nodes in paragraphs
    textNodes.forEach(textNode => {
      const p = document.createElement('p');
      p.setAttribute('data-line-spacing', this.currentDefault.toString());
      if (this.spacingClasses[this.currentDefault]) {
        p.classList.add(this.spacingClasses[this.currentDefault]);
      } else {
        p.style.lineHeight = this.currentDefault;
      }
      textNode.parentNode.insertBefore(p, textNode);
      p.appendChild(textNode);
    });
    
    // Ensure all block elements have spacing info
    const blocks = getBlockElements(container);
    blocks.forEach(block => {
      if (!block.getAttribute('data-line-spacing')) {
        // Apply current default spacing
        this.applySpacingToParagraph(block, this.currentDefault.toString());
      }
    });
  }
}