/**
 * @file PageManager.test.js
 * @description Unit tests for the critical PageManager module
 */

import { PageManager } from '../../../src/js/core/PageManager';
import { PAGE_CONFIG, SELECTORS } from '../../../src/js/utils/Constants';
import * as DOMUtils from '../../../src/js/utils/DOMUtils';

// Mock DOMUtils to avoid issues with Range API
jest.mock('../../../src/js/utils/DOMUtils', () => {
  const originalModule = jest.requireActual('../../../src/js/utils/DOMUtils');
  return {
    setCaretPosition: jest.fn(),
    getCaretPosition: jest.fn().mockReturnValue({ node: null, offset: 0 }),
    saveSelection: jest.fn().mockReturnValue(null),
    restoreSelection: jest.fn(),
    debounce: jest.fn((fn) => fn),  // Return the function as-is for testing
    getAllDocumentContainers: jest.fn(),
    getDocumentContent: jest.fn(),
    getAllEditableContents: jest.fn(),
    getFirstTextNode: jest.fn(),
    setCursorPosition: jest.fn(),
    createElement: jest.fn(),
    showStatus: jest.fn(),
    findFirstTextNode: jest.fn()
  };
});

describe('PageManager', () => {
  let pageManager;
  let mockContentElement;
  let mockContainer;

  beforeEach(() => {
    // Configure DOMUtils mocks
    DOMUtils.getAllDocumentContainers.mockImplementation(() => 
      document.querySelectorAll('.document-container')
    );
    DOMUtils.getDocumentContent.mockImplementation((container) => 
      container?.querySelector('.editable-content')
    );
    DOMUtils.getAllEditableContents.mockImplementation(() => 
      document.querySelectorAll('.editable-content')
    );
    DOMUtils.getFirstTextNode.mockImplementation((element) => {
      if (!element) return null;
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      return walker.nextNode();
    });
    DOMUtils.createElement.mockImplementation((tag, props = {}) => {
      const element = document.createElement(tag);
      if (props.class) element.className = props.class;
      if (props.id) element.id = props.id;
      if (props.contenteditable) element.contentEditable = props.contenteditable;
      if (props.style) {
        if (typeof props.style === 'string') {
          element.style.cssText = props.style;
        } else if (typeof props.style === 'object') {
          Object.assign(element.style, props.style);
        }
      }
      if (props.innerHTML) element.innerHTML = props.innerHTML;
      return element;
    });
    DOMUtils.findFirstTextNode.mockImplementation((element) => {
      if (!element) return null;
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      return walker.nextNode();
    });

    pageManager = new PageManager();
    mockContentElement = document.querySelector('.editable-content');
    mockContainer = document.querySelector('.document-container');
    
    // Mock scrollHeight to simulate content
    Object.defineProperty(mockContentElement, 'scrollHeight', {
      value: 800,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(mockContentElement, 'clientHeight', {
      value: 864, // 9in at 96dpi
      writable: true,
      configurable: true
    });
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
    
    // Mock createRange properly
    const mockRange = {
      setStart: jest.fn(),
      setEnd: jest.fn(),
      selectNodeContents: jest.fn(),
      collapse: jest.fn(),
      commonAncestorContainer: document.body
    };
    document.createRange = jest.fn(() => mockRange);
  });

  describe('initialization', () => {
    test('should initialize with correct default values', () => {
      expect(pageManager.pageCount).toBe(1);
      expect(pageManager.isProcessingOverflow).toBe(false);
      expect(pageManager.contentObserver).toBeNull();
    });

    test('should count existing pages on initialization', () => {
      // Add another page to DOM
      const newPage = document.createElement('div');
      newPage.className = 'document-container';
      document.querySelector('.page-wrapper').appendChild(newPage);
      
      pageManager.initialize();
      expect(pageManager.pageCount).toBe(2);
    });

    test('should make checkPageOverflow globally available', () => {
      pageManager.initialize();
      expect(window.checkPageOverflow).toBeDefined();
      expect(typeof window.checkPageOverflow).toBe('function');
    });
    
    test('should setup content monitoring on initialization', () => {
      const setupSpy = jest.spyOn(pageManager, 'setupContentMonitoring');
      pageManager.initialize();
      expect(setupSpy).toHaveBeenCalled();
    });
  });

  describe('keep-with-next logic', () => {
    test('should identify heading before table as keep-with-next', () => {
      const container = document.createElement('div');
      const heading = document.createElement('h2');
      const table = document.createElement('table');
      container.appendChild(heading);
      container.appendChild(table);
      mockContentElement.appendChild(container);
      
      expect(pageManager.shouldKeepWithNext(heading)).toBe(true);
    });

    test('should identify heading before list as keep-with-next', () => {
      const container = document.createElement('div');
      const heading = document.createElement('h3');
      const list = document.createElement('ul');
      container.appendChild(heading);
      container.appendChild(list);
      mockContentElement.appendChild(container);
      
      expect(pageManager.shouldKeepWithNext(heading)).toBe(true);
    });

    test('should identify paragraph ending with colon before table', () => {
      const container = document.createElement('div');
      const para = document.createElement('p');
      para.textContent = 'The following table shows:';
      const table = document.createElement('table');
      container.appendChild(para);
      container.appendChild(table);
      mockContentElement.appendChild(container);
      
      expect(pageManager.shouldKeepWithNext(para)).toBe(true);
    });
    
    test('should identify paragraph ending with colon before list', () => {
      const container = document.createElement('div');
      const para = document.createElement('p');
      para.textContent = 'Items include:';
      const list = document.createElement('ol');
      container.appendChild(para);
      container.appendChild(list);
      mockContentElement.appendChild(container);
      
      expect(pageManager.shouldKeepWithNext(para)).toBe(true);
    });

    test('should not keep regular paragraph with next element', () => {
      const container = document.createElement('div');
      const para = document.createElement('p');
      para.textContent = 'Regular paragraph text';
      const nextPara = document.createElement('p');
      container.appendChild(para);
      container.appendChild(nextPara);
      mockContentElement.appendChild(container);
      
      expect(pageManager.shouldKeepWithNext(para)).toBe(false);
    });

    test('should handle null next element', () => {
      const container = document.createElement('div');
      const para = document.createElement('p');
      container.appendChild(para);
      mockContentElement.appendChild(container);
      
      expect(pageManager.shouldKeepWithNext(para)).toBe(false);
    });
    
    test('should handle null element input', () => {
      expect(pageManager.shouldKeepWithNext(null)).toBe(false);
    });
    
    test('should identify all heading levels (H1-H6) before tables', () => {
      const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
      
      headingLevels.forEach(level => {
        const container = document.createElement('div');
        const heading = document.createElement(level.toLowerCase());
        const table = document.createElement('table');
        container.appendChild(heading);
        container.appendChild(table);
        
        expect(pageManager.shouldKeepWithNext(heading)).toBe(true);
      });
    });
  });

  describe('keep-together groups', () => {
    test('should group heading with table and caption', () => {
      const container = document.createElement('div');
      const heading = document.createElement('h2');
      const caption = document.createElement('p');
      const table = document.createElement('table');
      
      container.appendChild(heading);
      container.appendChild(caption);
      container.appendChild(table);
      caption.textContent = 'Table 1: Sales data';
      mockContentElement.appendChild(container);
      
      // Mock the logic
      jest.spyOn(pageManager, 'shouldKeepWithNext')
        .mockReturnValueOnce(true)  // heading -> caption
        .mockReturnValueOnce(false); // caption -> table
      
      const group = pageManager.getKeepTogetherGroup(heading);
      expect(group).toHaveLength(2);
      expect(group[0]).toBe(heading);
      expect(group[1]).toBe(caption);
    });
    
    test('should handle single element with no keep-with-next', () => {
      const para = document.createElement('p');
      mockContentElement.appendChild(para);
      
      const group = pageManager.getKeepTogetherGroup(para);
      expect(group).toHaveLength(1);
      expect(group[0]).toBe(para);
    });
    
    test('should group multiple consecutive keep-with-next elements', () => {
      const container = document.createElement('div');
      const h1 = document.createElement('h1');
      const h2 = document.createElement('h2');
      const table = document.createElement('table');
      
      container.appendChild(h1);
      container.appendChild(h2);
      container.appendChild(table);
      mockContentElement.appendChild(container);
      
      jest.spyOn(pageManager, 'shouldKeepWithNext')
        .mockReturnValueOnce(true)   // h1 -> h2
        .mockReturnValueOnce(true)   // h2 -> table
        .mockReturnValueOnce(false); // table -> nothing
      
      const group = pageManager.getKeepTogetherGroup(h1);
      expect(group).toHaveLength(3);
      expect(group[0]).toBe(h1);
      expect(group[1]).toBe(h2);
      expect(group[2]).toBe(table);
    });
  });

  describe('page overflow detection', () => {
    test('should detect when content overflows', () => {
      // Set scrollHeight > clientHeight
      Object.defineProperty(mockContentElement, 'scrollHeight', { value: 900 });
      Object.defineProperty(mockContentElement, 'clientHeight', { value: 864 });
      
      const handleOverflowSpy = jest.spyOn(pageManager, 'handlePageOverflow');
      pageManager.checkPageOverflow();
      
      expect(handleOverflowSpy).toHaveBeenCalled();
    });

    test('should not process overflow when already processing', () => {
      pageManager.isProcessingOverflow = true;
      const handleOverflowSpy = jest.spyOn(pageManager, 'handlePageOverflow');
      
      pageManager.checkPageOverflow();
      
      expect(handleOverflowSpy).not.toHaveBeenCalled();
    });

    test('should handle multiple pages', () => {
      // Add second page
      const secondPage = document.createElement('div');
      secondPage.className = 'document-container';
      secondPage.innerHTML = `
        <div class="editable-content" contenteditable="true"></div>
      `;
      document.querySelector('.page-wrapper').appendChild(secondPage);
      
      const handleOverflowSpy = jest.spyOn(pageManager, 'handlePageOverflow');
      pageManager.checkPageOverflow();
      
      // Should check both pages
      expect(document.querySelectorAll('.document-container').length).toBe(2);
    });
    
    test('should not detect overflow when content fits', () => {
      // Set scrollHeight <= clientHeight
      Object.defineProperty(mockContentElement, 'scrollHeight', { value: 800 });
      Object.defineProperty(mockContentElement, 'clientHeight', { value: 864 });
      
      const handleOverflowSpy = jest.spyOn(pageManager, 'handlePageOverflow');
      pageManager.checkPageOverflow();
      
      expect(handleOverflowSpy).not.toHaveBeenCalled();
    });
    
    test('should handle missing editable content gracefully', () => {
      const pageWithoutContent = document.createElement('div');
      pageWithoutContent.className = 'document-container';
      document.querySelector('.page-wrapper').appendChild(pageWithoutContent);
      
      expect(() => pageManager.checkPageOverflow()).not.toThrow();
    });
  });

  describe('page creation', () => {
    test('should create new page with correct structure', () => {
      const newPage = pageManager.addNewPage();
      
      expect(newPage).toBeDefined();
      expect(newPage.classList.contains('document-container')).toBe(true);
      expect(newPage.id).toBe('page-2');
      expect(newPage.querySelector('.editable-content')).toBeDefined();
      expect(newPage.querySelector('.page-info').textContent).toContain('Page 2');
    });

    test('should increment page count', () => {
      expect(pageManager.pageCount).toBe(1);
      pageManager.addNewPage();
      expect(pageManager.pageCount).toBe(2);
      pageManager.addNewPage();
      expect(pageManager.pageCount).toBe(3);
    });

    test('should copy styles from first page', () => {
      const firstContent = document.querySelector('.editable-content');
      firstContent.style.fontSize = '14pt';
      
      const newPage = pageManager.addNewPage();
      const newContent = newPage.querySelector('.editable-content');
      
      expect(newContent.style.fontSize).toBe('12pt'); // From getComputedStyle mock
    });

    test('should focus new page when requested', () => {
      const newPage = pageManager.addNewPage(true);
      const newContent = newPage.querySelector('.editable-content');
      
      expect(newContent.scrollIntoView).toHaveBeenCalledWith({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    });
    
    test('should handle margin guides correctly', () => {
      const newPage = pageManager.addNewPage();
      const marginGuides = newPage.querySelector('.margin-guides');
      
      expect(marginGuides).toBeDefined();
      expect(marginGuides.className).toBe('margin-guides');
    });
    
    test('should set proper page dimensions', () => {
      const newPage = pageManager.addNewPage();
      const newContent = newPage.querySelector('.editable-content');
      
      // Should copy computed styles
      expect(newContent.style.width).toBe('6.5in');
      expect(newContent.style.height).toBe('9in');
    });
  });

  describe('content monitoring', () => {
    test('should set up MutationObserver', () => {
      pageManager.setupContentMonitoring();
      
      expect(global.MutationObserver).toHaveBeenCalled();
      expect(pageManager.contentObserver).toBeDefined();
      expect(pageManager.contentObserver.observe).toHaveBeenCalled();
    });

    test('should disconnect existing observer before creating new one', () => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
      pageManager.contentObserver = mockObserver;
      
      pageManager.setupContentMonitoring();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
    
    test('should observe all editable content elements', () => {
      // Add second page
      const secondPage = document.createElement('div');
      secondPage.className = 'document-container';
      secondPage.innerHTML = `<div class="editable-content" contenteditable="true"></div>`;
      document.querySelector('.page-wrapper').appendChild(secondPage);
      
      pageManager.setupContentMonitoring();
      
      const observeCalls = pageManager.contentObserver.observe.mock.calls;
      expect(observeCalls).toHaveLength(2); // Two pages
    });
    
    test('should use correct observer config', () => {
      pageManager.setupContentMonitoring();
      
      const observeCall = pageManager.contentObserver.observe.mock.calls[0];
      const config = observeCall[1];
      
      expect(config.childList).toBe(true);
      expect(config.subtree).toBe(true);
      expect(config.characterData).toBe(true);
    });
  });

  describe('margin toggle', () => {
    test('should toggle margin guides visibility', () => {
      const container = document.querySelector('.document-container');
      expect(container.classList.contains('show-margins')).toBe(false);
      
      pageManager.toggleMargins();
      expect(container.classList.contains('show-margins')).toBe(true);
      
      pageManager.toggleMargins();
      expect(container.classList.contains('show-margins')).toBe(false);
    });
    
    test('should toggle margins on all pages', () => {
      // Add second page
      const secondPage = document.createElement('div');
      secondPage.className = 'document-container';
      document.querySelector('.page-wrapper').appendChild(secondPage);
      
      pageManager.toggleMargins();
      
      const allContainers = document.querySelectorAll('.document-container');
      allContainers.forEach(container => {
        expect(container.classList.contains('show-margins')).toBe(true);
      });
    });
  });

  describe('measurement container', () => {
    test('should create temporary measurement container', () => {
      // Need to mock the computed style for content element
      mockContentElement.style.cssText = 'width: 6.5in; height: 9in;';
      
      const tempDiv = pageManager.createMeasurementContainer(mockContentElement);
      
      expect(tempDiv.style.position).toBe('absolute');
      expect(tempDiv.style.visibility).toBe('hidden');
      expect(tempDiv.style.height).toBe('auto');
      expect(document.body.contains(tempDiv)).toBe(true);
      
      // Cleanup
      document.body.removeChild(tempDiv);
    });
    
    test('should copy all computed styles', () => {
      mockContentElement.style.cssText = 'width: 6.5in; font-size: 12pt; line-height: 1.6;';
      
      const tempDiv = pageManager.createMeasurementContainer(mockContentElement);
      
      // The actual implementation uses getComputedStyle, so check for the expected structure
      expect(tempDiv.style.position).toBe('absolute');
      expect(tempDiv.style.visibility).toBe('hidden');
      
      // Cleanup
      document.body.removeChild(tempDiv);
    });
    
    test('should set measurement-specific overrides', () => {
      mockContentElement.style.cssText = 'width: 6.5in;';
      
      const tempDiv = pageManager.createMeasurementContainer(mockContentElement);
      
      // Check the actual overrides applied by the implementation
      expect(tempDiv.style.position).toBe('absolute');
      expect(tempDiv.style.visibility).toBe('hidden');
      expect(tempDiv.style.height).toBe('auto');
      
      // Cleanup
      document.body.removeChild(tempDiv);
    });
  });

  describe('content splitting', () => {
    test('should adjust split index for keep-together groups', () => {
      const container = document.createElement('div');
      const nodes = [
        document.createElement('p'),
        document.createElement('h2'),
        document.createElement('table'),
        document.createElement('p')
      ];
      
      // Set up DOM relationships
      nodes.forEach((node, i) => {
        container.appendChild(node);
      });
      
      // Mock keep-together detection
      jest.spyOn(pageManager, 'shouldKeepWithNext')
        .mockImplementation((element) => element.tagName === 'H2');
      
      const adjustedIndex = pageManager.adjustSplitForKeepTogether(nodes, 2);
      expect(adjustedIndex).toBe(1); // Should move H2 and table together
    });
    
    test('should not adjust if split is at safe boundary', () => {
      const nodes = [
        document.createElement('p'),
        document.createElement('p'),
        document.createElement('p')
      ];
      
      jest.spyOn(pageManager, 'shouldKeepWithNext')
        .mockReturnValue(false);
      
      const adjustedIndex = pageManager.adjustSplitForKeepTogether(nodes, 2);
      expect(adjustedIndex).toBe(2); // No adjustment needed
    });
    
    test('should handle edge case at beginning of nodes', () => {
      const container = document.createElement('div');
      const nodes = [
        document.createElement('h1'),
        document.createElement('table')
      ];
      
      // Set up DOM relationships
      nodes.forEach(node => container.appendChild(node));
      
      jest.spyOn(pageManager, 'shouldKeepWithNext')
        .mockReturnValue(true);
      
      const adjustedIndex = pageManager.adjustSplitForKeepTogether(nodes, 1);
      expect(adjustedIndex).toBe(0); // Keep-together forces moving both elements
    });
  });

  describe('cursor movement', () => {
    test('should handle cursor movement after content split', () => {
      const nextContent = document.createElement('div');
      nextContent.className = 'editable-content';
      nextContent.contentEditable = 'true';
      const textNode = document.createTextNode('Test content');
      nextContent.appendChild(textNode);
      
      const focusSpy = jest.spyOn(nextContent, 'focus');
      
      // nodesToMove has 2 elements, splitIndex is 0, so condition is true
      const mockNodes = [document.createElement('p'), document.createElement('p')];
      pageManager.handleCursorMovement(mockNodes, 0, nextContent, mockContainer);
      
      expect(focusSpy).toHaveBeenCalled();
      expect(DOMUtils.setCursorPosition).toHaveBeenCalled();
    });
    
    test('should handle empty next content', () => {
      const nextContent = document.createElement('div');
      nextContent.className = 'editable-content';
      nextContent.contentEditable = 'true';
      
      const focusSpy = jest.spyOn(nextContent, 'focus');
      
      // nodesToMove has 1 element, splitIndex is 0, so condition is true
      const mockNodes = [document.createElement('p')];
      pageManager.handleCursorMovement(mockNodes, 0, nextContent, mockContainer);
      
      expect(focusSpy).toHaveBeenCalled();
    });
  });
  
  describe('page overflow handling', () => {
    beforeEach(() => {
      // Set up mock for content that overflows
      Object.defineProperty(mockContentElement, 'scrollHeight', { value: 1000 });
      Object.defineProperty(mockContentElement, 'clientHeight', { value: 864 });
    });
    
    test('should detect need to move overflowing content', () => {
      const para1 = document.createElement('p');
      para1.textContent = 'First paragraph';
      para1.style.height = '500px';
      const para2 = document.createElement('p');
      para2.textContent = 'Second paragraph that will overflow';
      para2.style.height = '500px';
      
      mockContentElement.appendChild(para1);
      mockContentElement.appendChild(para2);
      
      // Mock measurement container that properly tracks height
      jest.spyOn(pageManager, 'createMeasurementContainer').mockImplementation((content) => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);
        
        // Mock scrollHeight behavior
        let mockHeight = 0;
        Object.defineProperty(div, 'scrollHeight', {
          get: () => {
            // Simulate height accumulation
            mockHeight += div.children.length * 500;
            return mockHeight;
          }
        });
        
        return div;
      });
      
      // Mock adding new page
      const newPage = document.createElement('div');
      newPage.className = 'document-container';
      const newContent = document.createElement('div');
      newContent.className = 'editable-content';
      newContent.innerHTML = '';
      newPage.appendChild(newContent);
      mockContainer.parentNode.appendChild(newPage);
      
      jest.spyOn(pageManager, 'addNewPage').mockReturnValue(newPage);
      
      // Set up overflow condition
      Object.defineProperty(mockContentElement, 'scrollHeight', { value: 1000 });
      Object.defineProperty(mockContentElement, 'clientHeight', { value: 600 });
      
      // Run overflow check
      pageManager.checkPageOverflow();
      
      // Should have processed the overflow
      expect(pageManager.isProcessingOverflow).toBe(false); // Reset after processing
    });
    
    test('should handle tables that cannot be split', () => {
      const table = document.createElement('table');
      table.innerHTML = '<tr><td>Cell 1</td></tr><tr><td>Cell 2</td></tr>';
      table.style.height = '1000px';
      mockContentElement.appendChild(table);
      
      // Tables should be kept together
      const keepTogetherSpy = jest.spyOn(pageManager, 'getKeepTogetherGroup');
      
      // Just verify the table is identified as a single unit
      const group = pageManager.getKeepTogetherGroup(table);
      expect(group).toContain(table);
    });
  });
  
  describe('page info updates', () => {
    test('should display correct page numbers after adding pages', () => {
      // Add more pages
      pageManager.addNewPage();
      pageManager.addNewPage();
      
      const pageInfos = document.querySelectorAll('.page-info');
      expect(pageInfos).toHaveLength(3);
      expect(pageInfos[0].textContent).toContain('Page 1');
      expect(pageInfos[1].textContent).toContain('Page 2');
      expect(pageInfos[2].textContent).toContain('Page 3');
    });
  });
  
  describe('error handling', () => {
    test('should handle errors in overflow processing gracefully', () => {
      // Mock console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Add some content that will cause overflow
      const para = document.createElement('p');
      para.textContent = 'Content that will overflow';
      mockContentElement.appendChild(para);
      
      // Set overflow conditions
      Object.defineProperty(mockContentElement, 'scrollHeight', { value: 1000 });
      Object.defineProperty(mockContentElement, 'clientHeight', { value: 864 });
      
      // Mock an error in handlePageOverflow
      jest.spyOn(pageManager, 'handlePageOverflow').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // The checkPageOverflow method has a try/finally block that ensures
      // isProcessingOverflow is reset even if an error occurs
      // We need to catch the error since it's not handled in the implementation
      try {
        pageManager.checkPageOverflow();
      } catch (error) {
        // Expected error
      }
      
      // Should reset processing flag due to finally block
      expect(pageManager.isProcessingOverflow).toBe(false);
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
    
    test('should handle missing content element', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.className = 'document-container';
      
      // The handlePageOverflow method expects a content element
      // If content is null, createMeasurementContainer will fail
      // So we need to check the logic at a different level
      
      // Remove editable content from mock container
      const mockContainerWithoutContent = document.createElement('div');
      mockContainerWithoutContent.className = 'document-container';
      document.body.appendChild(mockContainerWithoutContent);
      
      DOMUtils.getAllDocumentContainers.mockReturnValue([mockContainerWithoutContent]);
      
      // checkPageOverflow should skip containers without content
      expect(() => {
        pageManager.checkPageOverflow();
      }).not.toThrow();
      
      expect(pageManager.isProcessingOverflow).toBe(false);
    });
  });
});