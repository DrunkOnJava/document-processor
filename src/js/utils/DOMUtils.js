/**
 * @file DOMUtils.js
 * @description DOM manipulation utilities for document processor
 * @module utils/DOMUtils
 */

import { BLOCK_TAGS, SPECIAL_DIV_CLASSES, SELECTORS } from './Constants.js';

/**
 * Get all block elements that should have spacing
 * @param {HTMLElement} container - Container element
 * @returns {NodeList} Block elements
 */
export function getBlockElements(container) {
  const selector = 'p, div:not(.image-container):not(.table-of-contents):not(.toc-content):not(.toc-entry), h1, h2, h3, h4, h5, h6, li, blockquote, pre';
  return container.querySelectorAll(selector);
}

/**
 * Get the containing paragraph element
 * @param {Node} node - Starting node
 * @returns {HTMLElement|null} Containing block element
 */
export function getContainingParagraph(node) {
  while (node && node !== document.body) {
    if (node.nodeType === 1) {
      if (BLOCK_TAGS.includes(node.tagName)) {
        // Skip special divs
        if (node.tagName === 'DIV') {
          const isSpecial = SPECIAL_DIV_CLASSES.some(cls => node.classList.contains(cls));
          if (isSpecial) {
            node = node.parentElement;
            continue;
          }
        }
        // Must be inside editable content
        if (node.closest(SELECTORS.EDITABLE_CONTENT)) {
          return node;
        }
      }
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Create a text walker for finding text nodes
 * @param {HTMLElement} container - Container element
 * @param {boolean} skipEmpty - Skip empty text nodes
 * @returns {TreeWalker} Text node walker
 */
export function createTextWalker(container, skipEmpty = true) {
  return document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (skipEmpty && !node.textContent.trim()) {
          return NodeFilter.FILTER_SKIP;
        }
        
        const parent = node.parentElement;
        const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'TD', 'TH'];
        
        // Check if we're directly in the content area or in a non-block element
        if (parent === container || !blockTags.includes(parent.tagName)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
}

/**
 * Find first text node in an element
 * @param {Node} node - Starting node
 * @returns {Text|null} First text node found
 */
export function findFirstTextNode(node) {
  if (node.nodeType === 3 && node.textContent.trim()) {
    return node;
  }
  for (let child of node.childNodes) {
    const found = findFirstTextNode(child);
    if (found) return found;
  }
  return null;
}

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {number} duration - Display duration in ms
 */
export function showStatus(message, duration = 2000) {
  const status = document.querySelector(SELECTORS.STATUS);
  if (status) {
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, duration);
  }
}

/**
 * Get all editable content areas
 * @returns {NodeList} All editable content elements
 */
export function getAllEditableContents() {
  return document.querySelectorAll(SELECTORS.EDITABLE_CONTENT);
}

/**
 * Get all document containers
 * @returns {NodeList} All document container elements
 */
export function getAllDocumentContainers() {
  return document.querySelectorAll(SELECTORS.DOCUMENT_CONTAINER);
}

/**
 * Create element with attributes
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes to set
 * @param {string|HTMLElement} content - Inner content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (typeof content === 'string') {
    element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  }
  
  return element;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Get current selection range
 * @returns {Range|null} Current selection range
 */
export function getCurrentRange() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;
  return selection.getRangeAt(0);
}

/**
 * Set cursor position
 * @param {Node} node - Target node
 * @param {number} offset - Character offset
 */
export function setCursorPosition(node, offset = 0) {
  const range = document.createRange();
  const selection = window.getSelection();
  
  range.setStart(node, offset);
  range.collapse(true);
  
  selection.removeAllRanges();
  selection.addRange(range);
}