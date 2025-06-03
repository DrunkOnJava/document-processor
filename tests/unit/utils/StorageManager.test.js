/**
 * @file StorageManager.test.js
 * @description Unit tests for StorageManager utility
 */

import { StorageManager } from '../../../src/js/utils/StorageManager';
import { STORAGE_CONFIG, SELECTORS } from '../../../src/js/utils/Constants';
import * as DOMUtils from '../../../src/js/utils/DOMUtils';
import { testDocuments } from '../../fixtures/testData';

// Mock DOMUtils
jest.mock('../../../src/js/utils/DOMUtils', () => ({
  getAllDocumentContainers: jest.fn(),
  getBlockElements: jest.fn(),
  showStatus: jest.fn()
}));

describe('StorageManager', () => {
  let storageManager;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Reset mocks
    DOMUtils.getAllDocumentContainers.mockReset();
    DOMUtils.getBlockElements.mockReset();
    DOMUtils.showStatus.mockReset();
    
    storageManager = new StorageManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with correct default values', () => {
      expect(storageManager.autoSaveInterval).toBeNull();
      expect(storageManager.version).toBe(STORAGE_CONFIG.VERSION);
    });
  });

  describe('auto-save functionality', () => {
    test('should initialize auto-save with default interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      jest.spyOn(storageManager, 'saveToLocalStorage').mockImplementation();
      
      storageManager.initAutoSave();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        STORAGE_CONFIG.AUTO_SAVE_INTERVAL
      );
      expect(storageManager.autoSaveInterval).toBeDefined();
      
      setIntervalSpy.mockRestore();
    });

    test('should initialize auto-save with custom interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      jest.spyOn(storageManager, 'saveToLocalStorage').mockImplementation();
      
      storageManager.initAutoSave(5000);
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5000
      );
      
      setIntervalSpy.mockRestore();
    });

    test('should stop existing auto-save before starting new one', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      storageManager.autoSaveInterval = 123;
      
      storageManager.initAutoSave();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      
      clearIntervalSpy.mockRestore();
    });

    test('should stop auto-save', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      storageManager.autoSaveInterval = 456;
      
      storageManager.stopAutoSave();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(456);
      expect(storageManager.autoSaveInterval).toBeNull();
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('saveToLocalStorage', () => {
    test('should save document with collected pages', () => {
      const mockContainers = [
        {
          querySelector: jest.fn().mockReturnValue({
            innerHTML: '<p>Page 1 content</p>'
          })
        },
        {
          querySelector: jest.fn().mockReturnValue({
            innerHTML: '<p>Page 2 content</p>'
          })
        }
      ];
      
      DOMUtils.getAllDocumentContainers.mockReturnValue(mockContainers);
      DOMUtils.getBlockElements.mockReturnValue([]);
      
      const result = storageManager.saveToLocalStorage(1.5);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_CONFIG.STORAGE_KEY,
        expect.any(String)
      );
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.pages).toHaveLength(2);
      expect(savedData.pageCount).toBe(2);
      expect(savedData.defaultLineSpacing).toBe(1.5);
      expect(savedData.version).toBe(STORAGE_CONFIG.VERSION);
    });

    test('should include timestamp and metadata', () => {
      DOMUtils.getAllDocumentContainers.mockReturnValue([]);
      
      const beforeTime = new Date().getTime();
      const result = storageManager.saveToLocalStorage();
      const afterTime = new Date().getTime();
      
      expect(result.timestamp).toBeDefined();
      const savedTime = new Date(result.timestamp).getTime();
      expect(savedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(savedTime).toBeLessThanOrEqual(afterTime);
      expect(result.format).toBe('US Letter');
      expect(result.margins).toBe('1 inch');
    });
  });

  describe('collectPages', () => {
    test('should collect content from all pages', () => {
      const mockBlocks = [
        { setAttribute: jest.fn() },
        { setAttribute: jest.fn() }
      ];
      
      const mockContainers = [
        {
          querySelector: jest.fn().mockReturnValue({
            innerHTML: '<p>Page 1</p>'
          })
        }
      ];
      
      DOMUtils.getAllDocumentContainers.mockReturnValue(mockContainers);
      DOMUtils.getBlockElements.mockReturnValue(mockBlocks);
      jest.spyOn(storageManager, 'getSpacingFromElement').mockReturnValue('2');
      
      const pages = storageManager.collectPages();
      
      expect(pages).toHaveLength(1);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].content).toBe('<p>Page 1</p>');
      expect(mockBlocks[0].setAttribute).toHaveBeenCalledWith('data-line-spacing', '2');
    });

    test('should handle missing editable content', () => {
      const mockContainers = [
        { querySelector: jest.fn().mockReturnValue(null) }
      ];
      
      DOMUtils.getAllDocumentContainers.mockReturnValue(mockContainers);
      
      const pages = storageManager.collectPages();
      
      expect(pages).toHaveLength(0);
    });
  });

  describe('getSpacingFromElement', () => {
    test('should get spacing from data attribute', () => {
      const element = {
        getAttribute: jest.fn().mockReturnValue('1.5'),
        classList: { contains: jest.fn() },
        style: {}
      };
      
      const result = storageManager.getSpacingFromElement(element);
      
      expect(result).toBe('1.5');
    });

    test('should get spacing from CSS class', () => {
      const element = {
        getAttribute: jest.fn().mockReturnValue(null),
        classList: { 
          contains: jest.fn().mockImplementation(cls => cls === 'spacing-1-5')
        },
        style: {}
      };
      
      const result = storageManager.getSpacingFromElement(element);
      
      expect(result).toBe('1.5');
    });

    test('should get spacing from inline style', () => {
      const element = {
        getAttribute: jest.fn().mockReturnValue(null),
        classList: { contains: jest.fn().mockReturnValue(false) },
        style: { lineHeight: '1.75' }
      };
      
      const result = storageManager.getSpacingFromElement(element);
      
      expect(result).toBe('1.75');
    });

    test('should return default spacing if none found', () => {
      const element = {
        getAttribute: jest.fn().mockReturnValue(null),
        classList: { contains: jest.fn().mockReturnValue(false) },
        style: {}
      };
      
      const result = storageManager.getSpacingFromElement(element);
      
      expect(result).toBe('2');
    });
  });

  describe('loadFromLocalStorage', () => {
    test('should load document from localStorage', () => {
      const testData = {
        pages: [{ pageNumber: 1, content: '<p>Test</p>' }],
        pageCount: 1,
        version: '3.0'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      const result = storageManager.loadFromLocalStorage();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_CONFIG.STORAGE_KEY);
      expect(result).toEqual(testData);
    });

    test('should load and convert legacy format', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce(null) // No current format
        .mockReturnValueOnce('<p>Legacy content</p>'); // Legacy format
      
      const result = storageManager.loadFromLocalStorage();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_CONFIG.LEGACY_KEY);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].content).toBe('<p>Legacy content</p>');
      expect(result.version).toBe('1.0');
    });

    test('should return null if no data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = storageManager.loadFromLocalStorage();
      
      expect(result).toBeNull();
    });

    test('should handle corrupted data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = storageManager.loadFromLocalStorage();
      
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading from localStorage:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('exportToJSON', () => {
    test('should export document and trigger download', () => {
      // Mock DOM methods
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      
      // Mock URL methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      // Mock save method
      jest.spyOn(storageManager, 'saveToLocalStorage').mockReturnValue({
        pages: [{ pageNumber: 1, content: '<p>Test</p>' }],
        pageCount: 1
      });
      
      const result = storageManager.exportToJSON(1.5);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toMatch(/^document-\d+\.json$/);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Document saved! (1 page)');
      expect(result).toBe('blob:mock-url');
    });

    test('should show plural pages in status', () => {
      const mockAnchor = { click: jest.fn() };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      
      jest.spyOn(storageManager, 'saveToLocalStorage').mockReturnValue({
        pages: [{}, {}, {}],
        pageCount: 3
      });
      
      storageManager.exportToJSON();
      
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Document saved! (3 pages)');
    });
  });

  describe('importFromJSON', () => {
    test('should import valid JSON file', async () => {
      const testData = {
        pages: [{ pageNumber: 1, content: '<p>Test</p>' }],
        version: '3.0'
      };
      const mockFile = new File([JSON.stringify(testData)], 'test.json');
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null
      };
      global.FileReader = jest.fn(() => mockFileReader);
      
      const promise = storageManager.importFromJSON(mockFile);
      
      // Trigger onload
      mockFileReader.onload({ target: { result: JSON.stringify(testData) } });
      
      const result = await promise;
      expect(result).toEqual(testData);
    });

    test('should reject invalid document format', async () => {
      const invalidData = { invalid: 'structure' };
      const mockFile = new File([JSON.stringify(invalidData)], 'test.json');
      
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null
      };
      global.FileReader = jest.fn(() => mockFileReader);
      
      const promise = storageManager.importFromJSON(mockFile);
      
      // Trigger onload
      mockFileReader.onload({ target: { result: JSON.stringify(invalidData) } });
      
      await expect(promise).rejects.toThrow('Invalid document format');
    });

    test('should reject on file read error', async () => {
      const mockFile = new File([''], 'test.json');
      
      const mockFileReader = {
        readAsText: jest.fn(),
        onerror: null
      };
      global.FileReader = jest.fn(() => mockFileReader);
      
      const promise = storageManager.importFromJSON(mockFile);
      
      // Trigger error
      mockFileReader.onerror();
      
      await expect(promise).rejects.toThrow('Failed to read file');
    });
  });

  describe('validateDocument', () => {
    test('should validate correct document structure', () => {
      const validDoc = {
        pages: [
          { pageNumber: 1, content: '<p>Test</p>' },
          { pageNumber: 2, content: '<p>Test 2</p>' }
        ],
        version: '3.0'
      };
      
      expect(storageManager.validateDocument(validDoc)).toBe(true);
    });

    test('should reject missing pages', () => {
      expect(storageManager.validateDocument({})).toBe(false);
      expect(storageManager.validateDocument({ pages: null })).toBe(false);
    });

    test('should reject invalid page structure', () => {
      const invalidDoc = {
        pages: [
          { content: '<p>Test</p>' }, // Missing pageNumber
          { pageNumber: 2 } // Missing content
        ]
      };
      
      expect(storageManager.validateDocument(invalidDoc)).toBe(false);
    });

    test('should warn about newer versions', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const newerDoc = {
        pages: [{ pageNumber: 1, content: '<p>Test</p>' }],
        version: '9.0'
      };
      
      expect(storageManager.validateDocument(newerDoc)).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Document version is newer than current version');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearStorage', () => {
    test('should remove both storage keys', () => {
      storageManager.clearStorage();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_CONFIG.STORAGE_KEY);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_CONFIG.LEGACY_KEY);
      expect(DOMUtils.showStatus).toHaveBeenCalledWith('Storage cleared');
    });
  });

  describe('getStorageInfo', () => {
    test('should return storage information', () => {
      const testData = {
        pages: [{ pageNumber: 1 }, { pageNumber: 2 }],
        version: '3.0',
        timestamp: '2024-01-01T00:00:00.000Z'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      // Mock Blob
      global.Blob = jest.fn().mockImplementation((content) => ({
        size: content[0].length
      }));
      
      const info = storageManager.getStorageInfo();
      
      expect(info.pages).toBe(2);
      expect(info.version).toBe('3.0');
      expect(info.lastSaved).toBe('2024-01-01T00:00:00.000Z');
      expect(info.size).toBeGreaterThan(0);
    });

    test('should handle no stored data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const info = storageManager.getStorageInfo();
      
      expect(info.size).toBe(0);
      expect(info.pages).toBe(0);
    });
  });
});