/**
 * @file Constants.js
 * @description Global constants and configuration for document processor
 * @module utils/Constants
 */

// Page dimensions - US Letter format
export const PAGE_CONFIG = {
  WIDTH: '8.5in',
  HEIGHT: '11in',
  MARGIN: '1in',
  CONTENT_HEIGHT: '9in',
  CONTENT_WIDTH: '6.5in'
};

// Line spacing options and CSS classes
export const SPACING_CONFIG = {
  DEFAULT: 2, // Double-spaced by default
  OPTIONS: {
    '1': { label: 'Single', class: 'spacing-1' },
    '1.15': { label: '1.15', class: 'spacing-1-15' },
    '1.5': { label: '1.5', class: 'spacing-1-5' },
    '2': { label: 'Double', class: 'spacing-2' },
    '2.5': { label: '2.5', class: 'spacing-2-5' },
    '3': { label: 'Triple', class: 'spacing-3' }
  }
};

// Auto-save configuration
export const STORAGE_CONFIG = {
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  STORAGE_KEY: 'document-multipages',
  LEGACY_KEY: 'document-autosave',
  VERSION: '3.0'
};

// DOM selectors
export const SELECTORS = {
  DOCUMENT_CONTAINER: '.document-container',
  EDITABLE_CONTENT: '.editable-content',
  PAGE_WRAPPER: '.page-wrapper',
  TABLE_OF_CONTENTS: '.table-of-contents',
  TOC_CONTENT: '.toc-content',
  TOOLBAR_CONTAINER: '.toolbar-container',
  LINE_SPACING_SELECT: '#lineSpacingSelect',
  STATUS: '#status',
  PAGE_INFO: '.page-info',
  MARGIN_GUIDES: '.margin-guides'
};

// Block element tags for paragraph detection
export const BLOCK_TAGS = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE'];

// Special div classes to skip
export const SPECIAL_DIV_CLASSES = ['image-container', 'table-of-contents', 'toc-content', 'toc-entry'];

// Keyboard shortcuts
export const SHORTCUTS = {
  LINE_SPACING: {
    SINGLE: { key: '1', spacing: '1' },
    DOUBLE: { key: '2', spacing: '2' },
    ONE_HALF: { key: '5', spacing: '1.5' }
  }
};

// Status message display duration
export const STATUS_TIMEOUT = 2000;

// Overflow check debounce delays
export const DEBOUNCE_DELAYS = {
  OVERFLOW_CHECK: 500,
  TOOLBAR_UPDATE: 50,
  INPUT_CHECK: 100
};

// Export file prefixes
export const EXPORT_PREFIXES = {
  JSON: 'document-',
  HTML: 'document-',
  MARKDOWN: 'document-'
};