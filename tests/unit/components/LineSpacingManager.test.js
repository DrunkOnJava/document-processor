/**
 * @file LineSpacingManager.test.js
 * @description Unit tests for the LineSpacingManager component
 */

import { LineSpacingManager } from '../../../src/js/components/LineSpacingManager';
import * as DOMUtils from '../../../src/js/utils/DOMUtils';
import { SPACING_CONFIG, SELECTORS } from '../../../src/js/utils/Constants';

// Mock DOMUtils module
jest.mock('../../../src/js/utils/DOMUtils', () => ({
  getContainingParagraph: jest.fn(),
  getBlockElements: jest.fn(),
  showStatus: jest.fn(),
  getCurrentRange: jest.fn()
}));

describe('LineSpacingManager', () => {
  let lineSpacingManager;
  let mockContentElement;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <select id="lineSpacingSelect" class="line-spacing-select">
        <option value="1">Single</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2" selected>Double</option>
        <option value="2.5">2.5</option>
        <option value="3">Triple</option>
      </select>
      <div class="editable-content" contenteditable="true">
        <p id="para1">Paragraph 1</p>
        <p id="para2">Paragraph 2</p>
        <h2 id="heading">Heading</h2>
        <p id="para3">Paragraph 3</p>
      </div>
    `;

    mockContentElement = document.querySelector('.editable-content');
    
    // Clear mocks
    DOMUtils.showStatus.mockClear();
    DOMUtils.getContainingParagraph.mockClear();
    DOMUtils.getBlockElements.mockClear();
    DOMUtils.getCurrentRange.mockClear();
    
    lineSpacingManager = new LineSpacingManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with correct default values', () => {
      expect(lineSpacingManager.currentDefault).toBe(SPACING_CONFIG.DEFAULT);
      expect(lineSpacingManager.spacingClasses).toBeDefined();
      expect(lineSpacingManager.spacingClasses['1']).toBe('spacing-1');
      expect(lineSpacingManager.spacingClasses['1.5']).toBe('spacing-1-5');
      expect(lineSpacingManager.spacingClasses['2']).toBe('spacing-2');
    });

    test('should set up event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      lineSpacingManager.initialize();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should update default spacing on initialize', () => {
      lineSpacingManager.initialize(1.5);
      expect(lineSpacingManager.currentDefault).toBe(1.5);
    });
  });

  describe('applySpacingToParagraph', () => {
    test('should apply spacing class to paragraph', () => {
      const para = document.getElementById('para1');
      
      lineSpacingManager.applySpacingToParagraph(para, '1.5');
      
      expect(para.classList.contains('spacing-1-5')).toBe(true);
      expect(para.getAttribute('data-line-spacing')).toBe('1.5');
      expect(para.style.lineHeight).toBe('');
    });

    test('should remove previous spacing classes', () => {
      const para = document.getElementById('para1');
      para.classList.add('spacing-1');
      
      lineSpacingManager.applySpacingToParagraph(para, '2');
      
      expect(para.classList.contains('spacing-1')).toBe(false);
      expect(para.classList.contains('spacing-2')).toBe(true);
      expect(para.getAttribute('data-line-spacing')).toBe('2');
    });

    test('should apply custom spacing as inline style', () => {
      const para = document.getElementById('para1');
      
      lineSpacingManager.applySpacingToParagraph(para, '1.75');
      
      expect(para.style.lineHeight).toBe('1.75');
      expect(para.getAttribute('data-line-spacing')).toBe('1.75');
      // Should not have any spacing classes
      Object.values(lineSpacingManager.spacingClasses).forEach(className => {
        expect(para.classList.contains(className)).toBe(false);
      });
    });

    test('should remove inline style when applying class-based spacing', () => {
      const para = document.getElementById('para1');
      para.style.lineHeight = '1.75';
      
      lineSpacingManager.applySpacingToParagraph(para, '1.5');
      
      expect(para.style.lineHeight).toBe('');
      expect(para.classList.contains('spacing-1-5')).toBe(true);
    });
  });

  describe('getSpacingFromParagraph', () => {
    test('should get spacing from data attribute', () => {
      const para = document.getElementById('para1');
      para.setAttribute('data-line-spacing', '1.5');
      
      const spacing = lineSpacingManager.getSpacingFromParagraph(para);
      expect(spacing).toBe(1.5);
    });

    test('should get spacing from class', () => {
      const para = document.getElementById('para1');
      para.classList.add('spacing-2');
      
      const spacing = lineSpacingManager.getSpacingFromParagraph(para);
      expect(spacing).toBe(2);
    });

    test('should get spacing from inline style', () => {
      const para = document.getElementById('para1');
      para.style.lineHeight = '1.75';
      
      const spacing = lineSpacingManager.getSpacingFromParagraph(para);
      expect(spacing).toBe(1.75);
    });

    test('should return default if no spacing found', () => {
      const para = document.getElementById('para1');
      lineSpacingManager.currentDefault = 1.5;
      
      const spacing = lineSpacingManager.getSpacingFromParagraph(para);
      expect(spacing).toBe(1.5);
    });

    test('should prioritize data attribute over class', () => {
      const para = document.getElementById('para1');
      para.setAttribute('data-line-spacing', '2.5');
      para.classList.add('spacing-2');
      
      const spacing = lineSpacingManager.getSpacingFromParagraph(para);
      expect(spacing).toBe(2.5);
    });
  });

  describe('getParagraphsFromSelection', () => {
    test('should get paragraph from collapsed selection', () => {
      const para = document.getElementById('para1');
      const range = document.createRange();
      range.selectNodeContents(para);
      range.collapse(true);
      
      window.getSelection = jest.fn(() => ({
        rangeCount: 1,
        getRangeAt: () => range
      }));
      
      DOMUtils.getContainingParagraph.mockReturnValue(para);
      
      const paragraphs = lineSpacingManager.getParagraphsFromSelection();
      expect(paragraphs).toEqual([para]);
    });

    test('should get multiple paragraphs from range selection', () => {
      const para1 = document.getElementById('para1');
      const para2 = document.getElementById('para2');
      const para3 = document.getElementById('para3');
      
      const range = document.createRange();
      range.setStartBefore(para1);
      range.setEndAfter(para2);
      
      window.getSelection = jest.fn(() => ({
        rangeCount: 1,
        getRangeAt: () => range,
        containsNode: (node, partial) => {
          return node === para1 || node === para2;
        }
      }));
      
      DOMUtils.getBlockElements.mockReturnValue([para1, para2, document.getElementById('heading'), para3]);
      
      const paragraphs = lineSpacingManager.getParagraphsFromSelection();
      expect(paragraphs).toEqual([para1, para2]);
    });

    test('should return empty array if no selection', () => {
      window.getSelection = jest.fn(() => ({
        rangeCount: 0
      }));
      
      const paragraphs = lineSpacingManager.getParagraphsFromSelection();
      expect(paragraphs).toEqual([]);
    });
  });

  describe('setLineSpacing', () => {
    test('should apply spacing to selected paragraphs', () => {
      const para1 = document.getElementById('para1');
      const para2 = document.getElementById('para2');
      
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([para1, para2]);
      jest.spyOn(lineSpacingManager, 'applySpacingToParagraph');
      jest.spyOn(lineSpacingManager, 'updateToolbarState');
      
      lineSpacingManager.setLineSpacing('1.5');
      
      expect(lineSpacingManager.applySpacingToParagraph).toHaveBeenCalledWith(para1, '1.5');
      expect(lineSpacingManager.applySpacingToParagraph).toHaveBeenCalledWith(para2, '1.5');
      expect(lineSpacingManager.currentDefault).toBe(1.5);
      expect(lineSpacingManager.updateToolbarState).toHaveBeenCalled();
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Line spacing set to 1.5');
    });

    test('should create paragraph if none exists', () => {
      const content = document.querySelector('.editable-content');
      content.innerHTML = ''; // Empty content
      
      // Mock activeElement
      Object.defineProperty(document, 'activeElement', {
        value: content,
        configurable: true
      });
      
      // Mock window.getSelection
      window.getSelection = jest.fn(() => ({
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      }));
      
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([]);
      
      lineSpacingManager.setLineSpacing('2');
      
      const newPara = content.querySelector('p');
      expect(newPara).toBeTruthy();
      expect(newPara.innerHTML).toBe('<br>');
    });

    test('should show correct status for predefined spacings', () => {
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([document.getElementById('para1')]);
      
      lineSpacingManager.setLineSpacing('1');
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Line spacing set to single');
      
      lineSpacingManager.setLineSpacing('2');
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Line spacing set to double');
      
      lineSpacingManager.setLineSpacing('3');
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Line spacing set to triple');
    });
  });

  describe('updateToolbarState', () => {
    test('should update select to show current spacing', () => {
      const select = document.querySelector('#lineSpacingSelect');
      const para = document.getElementById('para1');
      para.setAttribute('data-line-spacing', '1.5');
      
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([para]);
      jest.spyOn(lineSpacingManager, 'getSpacingFromParagraph').mockReturnValue(1.5);
      
      lineSpacingManager.updateToolbarState();
      
      expect(select.value).toBe('1.5');
    });

    test('should show mixed indicator for different spacings', () => {
      const select = document.querySelector('#lineSpacingSelect');
      const para1 = document.getElementById('para1');
      const para2 = document.getElementById('para2');
      
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([para1, para2]);
      jest.spyOn(lineSpacingManager, 'getSpacingFromParagraph')
        .mockReturnValueOnce(1.5)
        .mockReturnValueOnce(2);
      
      lineSpacingManager.updateToolbarState();
      
      const selectedOption = select.options[select.selectedIndex];
      expect(selectedOption.text).toContain('(Mixed)');
    });

    test('should show actual value if different from option', () => {
      const select = document.querySelector('#lineSpacingSelect');
      const para = document.getElementById('para1');
      
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([para]);
      jest.spyOn(lineSpacingManager, 'getSpacingFromParagraph').mockReturnValue(1.75);
      
      lineSpacingManager.updateToolbarState();
      
      // Should select closest option (1.5)
      expect(select.value).toBe('1.5');
      const selectedOption = select.options[select.selectedIndex];
      expect(selectedOption.text).toContain('(1.75)');
    });

    test('should use default spacing when no paragraphs selected', () => {
      const select = document.querySelector('#lineSpacingSelect');
      jest.spyOn(lineSpacingManager, 'getParagraphsFromSelection').mockReturnValue([]);
      lineSpacingManager.currentDefault = 1.5;
      
      lineSpacingManager.updateToolbarState();
      
      expect(select.value).toBe('1.5');
    });
  });

  describe('handleParagraphCreation', () => {
    test('should apply current spacing to new paragraph on Enter', (done) => {
      const currentPara = document.getElementById('para1');
      currentPara.setAttribute('data-line-spacing', '1.5');
      
      const selection = {
        rangeCount: 1,
        focusNode: currentPara.firstChild
      };
      window.getSelection = jest.fn(() => selection);
      
      DOMUtils.getContainingParagraph.mockReturnValue(currentPara);
      jest.spyOn(lineSpacingManager, 'getSpacingFromParagraph').mockReturnValue(1.5);
      jest.spyOn(lineSpacingManager, 'applySpacingToParagraph');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      lineSpacingManager.handleParagraphCreation(event);
      
      // Simulate new paragraph creation
      setTimeout(() => {
        const newPara = document.createElement('p');
        newPara.textContent = 'New paragraph';
        currentPara.parentNode.insertBefore(newPara, currentPara.nextSibling);
        
        DOMUtils.getContainingParagraph.mockReturnValue(newPara);
        window.getSelection = jest.fn(() => ({
          rangeCount: 1,
          focusNode: newPara.firstChild
        }));
        
        // Check that spacing was applied
        setTimeout(() => {
          expect(lineSpacingManager.applySpacingToParagraph).toHaveBeenCalledWith(newPara, '1.5');
          done();
        }, 20);
      }, 5);
    });

    test('should ignore non-Enter keys', () => {
      jest.spyOn(lineSpacingManager, 'getSpacingFromParagraph');
      
      const event = new KeyboardEvent('keydown', { key: 'A' });
      lineSpacingManager.handleParagraphCreation(event);
      
      expect(lineSpacingManager.getSpacingFromParagraph).not.toHaveBeenCalled();
    });
  });

  describe('normalizeParagraphs', () => {
    test('should wrap loose text nodes in paragraphs', () => {
      const container = document.createElement('div');
      container.className = 'editable-content';
      container.innerHTML = 'Loose text<p>Paragraph</p>More loose text';
      
      lineSpacingManager.currentDefault = 1.5;
      lineSpacingManager.normalizeParagraphs(container);
      
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(3); // Original + 2 wrapped
      expect(paragraphs[0].textContent).toBe('Loose text');
      expect(paragraphs[0].getAttribute('data-line-spacing')).toBe('1.5');
      expect(paragraphs[2].textContent).toBe('More loose text');
    });

    test('should add spacing to blocks without spacing info', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>Para 1</p><p>Para 2</p><h2>Heading</h2>';
      
      DOMUtils.getBlockElements.mockReturnValue(container.querySelectorAll('p, h2'));
      
      lineSpacingManager.currentDefault = 2;
      lineSpacingManager.normalizeParagraphs(container);
      
      const blocks = container.querySelectorAll('p, h2');
      blocks.forEach(block => {
        expect(block.getAttribute('data-line-spacing')).toBe('2');
      });
    });

    test('should not wrap empty text nodes', () => {
      const container = document.createElement('div');
      container.innerHTML = '   <p>Paragraph</p>   ';
      
      lineSpacingManager.normalizeParagraphs(container);
      
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(1); // Only the original paragraph
    });

    test('should not wrap text already in block elements', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>Already in paragraph</p><h2>In heading</h2><blockquote>In quote</blockquote>';
      
      DOMUtils.getBlockElements.mockReturnValue(container.querySelectorAll('p, h2, blockquote'));
      
      const originalHTML = container.innerHTML;
      lineSpacingManager.normalizeParagraphs(container);
      
      // Structure should remain the same
      expect(container.querySelectorAll('p').length).toBe(1);
      expect(container.querySelectorAll('h2').length).toBe(1);
      expect(container.querySelectorAll('blockquote').length).toBe(1);
    });
  });

  describe('keyboard shortcuts', () => {
    test('should handle line spacing keyboard shortcuts', () => {
      const content = document.querySelector('.editable-content');
      content.focus();
      
      // Mock getSelection to avoid errors
      window.getSelection = jest.fn(() => ({
        rangeCount: 0
      }));
      
      jest.spyOn(lineSpacingManager, 'setLineSpacing');
      lineSpacingManager.initialize();
      
      // Test Ctrl+1 for single spacing
      const event1 = new KeyboardEvent('keydown', { 
        key: '1', 
        ctrlKey: true
      });
      Object.defineProperty(event1, 'target', {
        value: content,
        configurable: true
      });
      document.dispatchEvent(event1);
      
      expect(lineSpacingManager.setLineSpacing).toHaveBeenCalledWith('1');
    });

    test('should ignore shortcuts with additional modifiers', () => {
      const content = document.querySelector('.editable-content');
      content.focus();
      
      // Mock getSelection to avoid errors
      window.getSelection = jest.fn(() => ({
        rangeCount: 0
      }));
      
      jest.spyOn(lineSpacingManager, 'setLineSpacing');
      lineSpacingManager.initialize();
      
      // Test Ctrl+Shift+1 (should be ignored)
      const event = new KeyboardEvent('keydown', { 
        key: '1', 
        ctrlKey: true,
        shiftKey: true
      });
      Object.defineProperty(event, 'target', {
        value: content,
        configurable: true
      });
      document.dispatchEvent(event);
      
      expect(lineSpacingManager.setLineSpacing).not.toHaveBeenCalled();
    });
  });
});