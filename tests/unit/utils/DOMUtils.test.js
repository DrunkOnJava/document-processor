/**
 * @file DOMUtils.test.js
 * @description Unit tests for DOM manipulation utilities
 */

import * as DOMUtils from '../../../src/js/utils/DOMUtils.js';
import { BLOCK_TAGS, SPECIAL_DIV_CLASSES, SELECTORS } from '../../../src/js/utils/Constants.js';

describe('DOMUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('getBlockElements', () => {
    test('should get all block elements except special divs', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Paragraph</p>
        <div>Regular div</div>
        <div class="image-container">Image div</div>
        <div class="table-of-contents">TOC div</div>
        <div class="toc-content">TOC content</div>
        <div class="toc-entry">TOC entry</div>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
        <li>List item</li>
        <blockquote>Quote</blockquote>
        <pre>Code</pre>
      `;

      const elements = DOMUtils.getBlockElements(container);
      
      expect(elements.length).toBe(11); // All except the 4 special divs
      expect(elements[0].tagName).toBe('P');
      expect(elements[1].tagName).toBe('DIV');
      expect(elements[1].className).toBe('');
      expect(elements[2].tagName).toBe('H1');
    });

    test('should return empty NodeList for empty container', () => {
      const container = document.createElement('div');
      const elements = DOMUtils.getBlockElements(container);
      expect(elements.length).toBe(0);
    });
  });

  describe('getContainingParagraph', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="editable-content" contenteditable="true">
          <p id="p1">Paragraph 1</p>
          <div id="div1">Regular div</div>
          <div class="image-container" id="special">
            <p id="p2">Inside special div</p>
          </div>
          <h1 id="h1">Heading</h1>
        </div>
        <p id="outside">Outside editable</p>
      `;
    });

    test('should find containing paragraph for text node', () => {
      const p1 = document.getElementById('p1');
      const textNode = p1.firstChild;
      const result = DOMUtils.getContainingParagraph(textNode);
      expect(result).toBe(p1);
    });

    test('should find containing div for content inside', () => {
      const div1 = document.getElementById('div1');
      const textNode = div1.firstChild;
      const result = DOMUtils.getContainingParagraph(textNode);
      expect(result).toBe(div1);
    });

    test('should skip special div classes', () => {
      const p2 = document.getElementById('p2');
      const textNode = p2.firstChild;
      const result = DOMUtils.getContainingParagraph(textNode);
      expect(result).toBe(p2);
    });

    test('should return null for content outside editable area', () => {
      const outside = document.getElementById('outside');
      const textNode = outside.firstChild;
      const result = DOMUtils.getContainingParagraph(textNode);
      expect(result).toBeNull();
    });

    test('should return null when starting from document.body', () => {
      const result = DOMUtils.getContainingParagraph(document.body);
      expect(result).toBeNull();
    });

    test('should find containing heading', () => {
      const h1 = document.getElementById('h1');
      const textNode = h1.firstChild;
      const result = DOMUtils.getContainingParagraph(textNode);
      expect(result).toBe(h1);
    });

    test('should handle nested elements', () => {
      const p1 = document.getElementById('p1');
      const span = document.createElement('span');
      p1.appendChild(span);
      const textNode = document.createTextNode('Nested text');
      span.appendChild(textNode);
      
      const result = DOMUtils.getContainingParagraph(textNode);
      expect(result).toBe(p1);
    });
  });

  describe('createTextWalker', () => {
    test('should create walker that finds text nodes', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        Direct text
        <span>Text in span</span>
      `;

      const walker = DOMUtils.createTextWalker(container);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      // Walker should find text nodes directly in container or in non-block elements
      expect(textNodes.length).toBe(2);
      expect(textNodes[0].textContent.trim()).toBe('Direct text');
      expect(textNodes[1].textContent).toBe('Text in span');
    });

    test('should skip empty text nodes by default', () => {
      const container = document.createElement('div');
      container.textContent = '   '; // Empty whitespace
      const span = document.createElement('span');
      span.textContent = 'Non-empty text';
      container.appendChild(span);

      const walker = DOMUtils.createTextWalker(container);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      // Should skip the empty text node and only get the non-empty one
      expect(textNodes.length).toBe(1);
      expect(textNodes[0].textContent).toBe('Non-empty text');
    });

    test('should include empty text nodes when skipEmpty is false', () => {
      const container = document.createElement('div');
      container.textContent = '   '; // Empty whitespace directly in container
      const span = document.createElement('span');
      span.textContent = 'Text';
      container.appendChild(span);

      const walker = DOMUtils.createTextWalker(container, false);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      expect(textNodes.length).toBe(2);
      expect(textNodes[0].textContent).toBe('   '); // Empty text node
      expect(textNodes[1].textContent).toBe('Text'); // Non-empty text node
    });

    test('should accept text nodes directly in container', () => {
      const container = document.createElement('div');
      container.textContent = 'Direct text';

      const walker = DOMUtils.createTextWalker(container);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      expect(textNodes.length).toBe(1);
      expect(textNodes[0].textContent).toBe('Direct text');
    });

    test('should skip text nodes in block elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        Text before
        <p>Text in paragraph</p>
        Text after
      `;

      const walker = DOMUtils.createTextWalker(container);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      // Should only get the text nodes directly in the container
      expect(textNodes.length).toBe(2);
      expect(textNodes[0].textContent.trim()).toBe('Text before');
      expect(textNodes[1].textContent.trim()).toBe('Text after');
    });
  });

  describe('findFirstTextNode', () => {
    test('should find text node in simple element', () => {
      const p = document.createElement('p');
      p.textContent = 'Simple text';
      
      const result = DOMUtils.findFirstTextNode(p);
      expect(result).toBe(p.firstChild);
      expect(result.textContent).toBe('Simple text');
    });

    test('should find text node in nested structure', () => {
      const div = document.createElement('div');
      div.innerHTML = '<span><strong>Nested text</strong></span>';
      
      const result = DOMUtils.findFirstTextNode(div);
      expect(result.textContent).toBe('Nested text');
    });

    test('should skip empty text nodes', () => {
      const div = document.createElement('div');
      div.innerHTML = '   <span>Non-empty</span>';
      
      const result = DOMUtils.findFirstTextNode(div);
      expect(result.textContent).toBe('Non-empty');
    });

    test('should return null for element with no text', () => {
      const div = document.createElement('div');
      div.innerHTML = '<img src="test.jpg">';
      
      const result = DOMUtils.findFirstTextNode(div);
      expect(result).toBeNull();
    });

    test('should return text node when passed directly', () => {
      const textNode = document.createTextNode('Direct text');
      const result = DOMUtils.findFirstTextNode(textNode);
      expect(result).toBe(textNode);
    });

    test('should return null for empty text node', () => {
      const textNode = document.createTextNode('   ');
      const result = DOMUtils.findFirstTextNode(textNode);
      expect(result).toBeNull();
    });
  });

  describe('showStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should show and hide status message', () => {
      document.body.innerHTML = '<div id="status" style="display: none;"></div>';
      const status = document.querySelector('#status');

      DOMUtils.showStatus('Test message');

      expect(status.textContent).toBe('Test message');
      expect(status.style.display).toBe('block');

      jest.advanceTimersByTime(2000);

      expect(status.style.display).toBe('none');
    });

    test('should use custom duration', () => {
      document.body.innerHTML = '<div id="status" style="display: none;"></div>';
      const status = document.querySelector('#status');

      DOMUtils.showStatus('Test message', 5000);

      expect(status.style.display).toBe('block');

      jest.advanceTimersByTime(2000);
      expect(status.style.display).toBe('block');

      jest.advanceTimersByTime(3000);
      expect(status.style.display).toBe('none');
    });

    test('should handle missing status element', () => {
      document.body.innerHTML = '';
      
      // Should not throw
      expect(() => {
        DOMUtils.showStatus('Test message');
      }).not.toThrow();
    });
  });

  describe('getAllEditableContents', () => {
    test('should get all editable content areas', () => {
      document.body.innerHTML = `
        <div class="editable-content" contenteditable="true">1</div>
        <div class="other">2</div>
        <div class="editable-content" contenteditable="true">3</div>
      `;

      const contents = DOMUtils.getAllEditableContents();
      expect(contents.length).toBe(2);
      expect(contents[0].textContent).toBe('1');
      expect(contents[1].textContent).toBe('3');
    });

    test('should return empty NodeList when no editable content', () => {
      document.body.innerHTML = '<div>No editable content</div>';
      const contents = DOMUtils.getAllEditableContents();
      expect(contents.length).toBe(0);
    });
  });

  describe('getAllDocumentContainers', () => {
    test('should get all document containers', () => {
      document.body.innerHTML = `
        <div class="document-container">1</div>
        <div class="other">2</div>
        <div class="document-container">3</div>
      `;

      const containers = DOMUtils.getAllDocumentContainers();
      expect(containers.length).toBe(2);
      expect(containers[0].textContent).toBe('1');
      expect(containers[1].textContent).toBe('3');
    });

    test('should return empty NodeList when no containers', () => {
      document.body.innerHTML = '<div>No containers</div>';
      const containers = DOMUtils.getAllDocumentContainers();
      expect(containers.length).toBe(0);
    });
  });

  describe('createElement', () => {
    test('should create element with tag only', () => {
      const element = DOMUtils.createElement('div');
      expect(element.tagName).toBe('DIV');
      expect(element.innerHTML).toBe('');
    });

    test('should create element with attributes', () => {
      const element = DOMUtils.createElement('div', {
        id: 'test-id',
        'data-value': '123',
        class: 'test-class'
      });

      expect(element.id).toBe('test-id');
      expect(element.getAttribute('data-value')).toBe('123');
      expect(element.className).toBe('test-class');
    });

    test('should create element with style object', () => {
      const element = DOMUtils.createElement('div', {
        style: {
          color: 'red',
          fontSize: '16px'
        }
      });

      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
    });

    test('should create element with string content', () => {
      const element = DOMUtils.createElement('p', {}, 'Test content');
      expect(element.innerHTML).toBe('Test content');
    });

    test('should create element with HTML content', () => {
      const element = DOMUtils.createElement('div', {}, '<span>HTML content</span>');
      expect(element.innerHTML).toBe('<span>HTML content</span>');
      expect(element.firstChild.tagName).toBe('SPAN');
    });

    test('should create element with element content', () => {
      const child = document.createElement('span');
      child.textContent = 'Child element';
      const element = DOMUtils.createElement('div', {}, child);
      
      expect(element.firstChild).toBe(child);
      expect(element.textContent).toBe('Child element');
    });

    test('should handle all parameters together', () => {
      const element = DOMUtils.createElement('button', {
        id: 'test-btn',
        class: 'btn btn-primary',
        style: { padding: '10px' },
        type: 'button'
      }, 'Click me');

      expect(element.tagName).toBe('BUTTON');
      expect(element.id).toBe('test-btn');
      expect(element.className).toBe('btn btn-primary');
      expect(element.style.padding).toBe('10px');
      expect(element.type).toBe('button');
      expect(element.textContent).toBe('Click me');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debounced = DOMUtils.debounce(mockFn, 100);

      debounced('arg1');
      debounced('arg2');
      debounced('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    test('should maintain context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function() { return this.value; })
      };

      obj.debounced = DOMUtils.debounce(obj.method, 100);
      obj.debounced();

      jest.advanceTimersByTime(100);

      expect(obj.method).toHaveBeenCalledTimes(1);
      expect(obj.method.mock.instances[0]).toBe(obj);
    });

    test('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debounced = DOMUtils.debounce(mockFn, 100);

      debounced('arg1', 'arg2', 'arg3');

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    test('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debounced = DOMUtils.debounce(mockFn, 100);

      debounced();
      jest.advanceTimersByTime(50);
      
      debounced();
      jest.advanceTimersByTime(50);
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentRange', () => {
    test('should get current selection range', () => {
      const div = document.createElement('div');
      div.innerHTML = 'Test text';
      document.body.appendChild(div);

      const mockRange = { type: 'range' };
      
      window.getSelection = jest.fn(() => ({
        rangeCount: 1,
        getRangeAt: jest.fn((index) => {
          if (index === 0) return mockRange;
          throw new Error('Invalid range index');
        })
      }));

      const result = DOMUtils.getCurrentRange();
      expect(result).toBe(mockRange);
    });

    test('should return null when no selection', () => {
      window.getSelection = jest.fn(() => ({
        rangeCount: 0,
        getRangeAt: jest.fn()
      }));

      const result = DOMUtils.getCurrentRange();
      expect(result).toBeNull();
    });
  });

  describe('setCursorPosition', () => {
    test('should set cursor at specified position', () => {
      const p = document.createElement('p');
      const textNode = document.createTextNode('Test text');
      p.appendChild(textNode);
      document.body.appendChild(p);

      // Mock the selection behavior
      const mockRange = {
        startContainer: null,
        startOffset: null,
        collapsed: true
      };
      
      const createdRange = {
        startContainer: null,
        startOffset: null
      };
      
      const mockSelection = {
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      };
      
      window.getSelection = jest.fn(() => mockSelection);
      document.createRange = jest.fn(() => ({
        setStart: jest.fn((node, offset) => {
          createdRange.startContainer = node;
          createdRange.startOffset = offset;
        }),
        collapse: jest.fn()
      }));

      DOMUtils.setCursorPosition(textNode, 5);

      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalled();
      expect(createdRange.startContainer).toBe(textNode);
      expect(createdRange.startOffset).toBe(5);
    });

    test('should set cursor at beginning by default', () => {
      const textNode = document.createTextNode('Test text');
      
      const mockRange = {
        startOffset: null
      };
      
      const mockSelection = {
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      };
      
      window.getSelection = jest.fn(() => mockSelection);
      document.createRange = jest.fn(() => ({
        setStart: jest.fn((node, offset) => {
          mockRange.startOffset = offset;
        }),
        collapse: jest.fn()
      }));

      DOMUtils.setCursorPosition(textNode);

      expect(mockRange.startOffset).toBe(0);
    });

    test('should clear existing selection', () => {
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      div1.textContent = 'First';
      div2.textContent = 'Second';
      document.body.appendChild(div1);
      document.body.appendChild(div2);

      const mockSelection = {
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      };
      
      window.getSelection = jest.fn(() => mockSelection);

      // Set cursor in different location
      DOMUtils.setCursorPosition(div2.firstChild, 3);

      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalled();
    });
  });
});