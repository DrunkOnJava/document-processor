/**
 * @file MarkdownExporter.js
 * @description Exports document content to Markdown format
 * @module export/MarkdownExporter
 */

import { SELECTORS } from '../utils/Constants.js';
import { getAllDocumentContainers } from '../utils/DOMUtils.js';

/**
 * Handles Markdown export functionality
 */
export class MarkdownExporter {
  constructor() {
    this.listStack = [];
  }

  /**
   * Export document as Markdown
   * @returns {string} Markdown content
   */
  export() {
    const containers = getAllDocumentContainers();
    let markdown = '';
    
    containers.forEach((container, index) => {
      const content = container.querySelector(SELECTORS.EDITABLE_CONTENT);
      if (content) {
        if (index > 0) {
          markdown += '\n---\n\n'; // Page separator
        }
        markdown += this.convertToMarkdown(content);
      }
    });
    
    return markdown.trim();
  }

  /**
   * Convert HTML element to Markdown
   * @param {HTMLElement} element - Element to convert
   * @returns {string} Markdown text
   */
  convertToMarkdown(element) {
    let markdown = '';
    
    // Process all child nodes
    element.childNodes.forEach(node => {
      markdown += this.processNode(node);
    });
    
    return markdown;
  }

  /**
   * Process a single node
   * @param {Node} node - Node to process
   * @returns {string} Markdown text
   */
  processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return this.escapeMarkdown(node.textContent);
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const element = node;
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
      case 'h1':
        return `# ${this.getTextContent(element)}\n\n`;
      
      case 'h2':
        return `## ${this.getTextContent(element)}\n\n`;
      
      case 'h3':
        return `### ${this.getTextContent(element)}\n\n`;
      
      case 'h4':
        return `#### ${this.getTextContent(element)}\n\n`;
      
      case 'h5':
        return `##### ${this.getTextContent(element)}\n\n`;
      
      case 'h6':
        return `###### ${this.getTextContent(element)}\n\n`;
      
      case 'p':
        const text = this.processInlineElements(element);
        return text.trim() ? `${text}\n\n` : '';
      
      case 'ul':
        return this.processList(element, false) + '\n';
      
      case 'ol':
        return this.processList(element, true) + '\n';
      
      case 'li':
        // Handled by processList
        return '';
      
      case 'blockquote':
        const quoteContent = this.convertToMarkdown(element).trim();
        return quoteContent.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
      
      case 'pre':
        return '```\n' + element.textContent + '\n```\n\n';
      
      case 'code':
        return '`' + element.textContent + '`';
      
      case 'table':
        return this.processTable(element) + '\n\n';
      
      case 'br':
        return '  \n'; // Two spaces for line break
      
      case 'hr':
        return '---\n\n';
      
      case 'img':
        const alt = element.alt || 'image';
        const src = element.src || '';
        return `![${alt}](${src})\n\n`;
      
      case 'a':
        const href = element.href || '#';
        const linkText = this.getTextContent(element);
        return `[${linkText}](${href})`;
      
      case 'strong':
      case 'b':
        return `**${this.processInlineElements(element)}**`;
      
      case 'em':
      case 'i':
        return `*${this.processInlineElements(element)}*`;
      
      case 'u':
        // Markdown doesn't have underline, use emphasis
        return `_${this.processInlineElements(element)}_`;
      
      case 'div':
        // Check for special divs
        if (element.classList.contains('table-of-contents')) {
          return this.processTOC(element);
        }
        // Process div content like a paragraph
        const divContent = this.convertToMarkdown(element);
        return divContent;
      
      default:
        // Process unknown elements as inline
        return this.processInlineElements(element);
    }
  }

  /**
   * Process inline elements
   * @param {HTMLElement} element - Element to process
   * @returns {string} Processed text
   */
  processInlineElements(element) {
    let text = '';
    
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += this.escapeMarkdown(node.textContent);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        text += this.processNode(node);
      }
    });
    
    return text;
  }

  /**
   * Process list element
   * @param {HTMLElement} listElement - List element
   * @param {boolean} ordered - Is ordered list
   * @returns {string} Markdown list
   */
  processList(listElement, ordered) {
    let markdown = '';
    const items = listElement.querySelectorAll(':scope > li');
    
    items.forEach((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : '- ';
      const indent = '  '.repeat(this.listStack.length);
      
      // Process list item content
      let itemContent = '';
      item.childNodes.forEach(node => {
        if (node.tagName === 'UL' || node.tagName === 'OL') {
          // Nested list
          this.listStack.push(true);
          itemContent += '\n' + this.processList(node, node.tagName === 'OL');
          this.listStack.pop();
        } else {
          itemContent += this.processNode(node);
        }
      });
      
      markdown += indent + prefix + itemContent.trim() + '\n';
    });
    
    return markdown;
  }

  /**
   * Process table element
   * @param {HTMLElement} table - Table element
   * @returns {string} Markdown table
   */
  processTable(table) {
    let markdown = '';
    const rows = table.querySelectorAll('tr');
    
    if (rows.length === 0) return '';
    
    // Process header row
    const headerCells = rows[0].querySelectorAll('th, td');
    if (headerCells.length > 0) {
      markdown += '| ';
      headerCells.forEach(cell => {
        markdown += this.getTextContent(cell).trim() + ' | ';
      });
      markdown += '\n';
      
      // Add separator row
      markdown += '| ';
      headerCells.forEach(() => {
        markdown += '--- | ';
      });
      markdown += '\n';
    }
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td');
      if (cells.length > 0) {
        markdown += '| ';
        cells.forEach(cell => {
          markdown += this.getTextContent(cell).trim() + ' | ';
        });
        markdown += '\n';
      }
    }
    
    return markdown;
  }

  /**
   * Process Table of Contents
   * @param {HTMLElement} tocElement - TOC element
   * @returns {string} Markdown TOC
   */
  processTOC(tocElement) {
    let markdown = '## Table of Contents\n\n';
    
    const entries = tocElement.querySelectorAll('.toc-entry');
    entries.forEach(entry => {
      const level = entry.className.match(/toc-level-(\d)/);
      const indent = level ? '  '.repeat(parseInt(level[1]) - 1) : '';
      const title = entry.querySelector('.toc-title')?.textContent.trim() || '';
      const page = entry.querySelector('.toc-page')?.textContent.trim() || '';
      
      markdown += `${indent}- ${title} (Page ${page})\n`;
    });
    
    return markdown + '\n';
  }

  /**
   * Get text content of element
   * @param {HTMLElement} element - Element
   * @returns {string} Text content
   */
  getTextContent(element) {
    return element.textContent.trim();
  }

  /**
   * Escape special Markdown characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeMarkdown(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }
}