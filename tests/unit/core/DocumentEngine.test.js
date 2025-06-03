/**
 * @file DocumentEngine.test.js
 * @description Unit tests for the DocumentEngine orchestrator module
 */

import { DocumentEngine } from '../../../src/js/core/DocumentEngine';
import { StorageManager } from '../../../src/js/utils/StorageManager';
import { PageManager } from '../../../src/js/core/PageManager';
import { ContentEditor } from '../../../src/js/components/ContentEditor';
import { LineSpacingManager } from '../../../src/js/components/LineSpacingManager';
import { TableOfContents } from '../../../src/js/components/TableOfContents';
import { Toolbar } from '../../../src/js/components/Toolbar';
import { ExportManager } from '../../../src/js/export/ExportManager';
import { STORAGE_CONFIG } from '../../../src/js/utils/Constants';

// Mock all dependencies
jest.mock('../../../src/js/utils/StorageManager');
jest.mock('../../../src/js/core/PageManager');
jest.mock('../../../src/js/components/ContentEditor');
jest.mock('../../../src/js/components/LineSpacingManager');
jest.mock('../../../src/js/components/TableOfContents');
jest.mock('../../../src/js/components/Toolbar');
jest.mock('../../../src/js/export/ExportManager');

describe('DocumentEngine', () => {
  let documentEngine;
  let mockStorageManager;
  let mockPageManager;
  let mockContentEditor;
  let mockLineSpacingManager;
  let mockTableOfContents;
  let mockToolbar;
  let mockExportManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockStorageManager = {
      initAutoSave: jest.fn(),
      stopAutoSave: jest.fn(),
      loadFromLocalStorage: jest.fn(),
      clearStorage: jest.fn(),
      getStorageInfo: jest.fn().mockReturnValue({
        pages: 1,
        version: '3.0',
        lastSaved: new Date().toISOString(),
        size: 1024
      })
    };

    mockPageManager = {
      initialize: jest.fn(),
      checkPageOverflow: jest.fn(),
      getPageCount: jest.fn().mockReturnValue(1),
      pageCount: 1,
      contentObserver: null
    };

    mockContentEditor = {
      initialize: jest.fn(),
      initializeDocument: jest.fn(),
      setupGlobalFunctions: jest.fn(),
      isEditMode: jest.fn().mockReturnValue(true)
    };

    mockLineSpacingManager = {
      initialize: jest.fn(),
      currentDefault: 2
    };

    mockTableOfContents = {
      initialize: jest.fn(),
      updateAllTOCs: jest.fn(),
      setupGlobalNavigation: jest.fn()
    };

    mockToolbar = {
      initialize: jest.fn(),
      loadDocumentData: jest.fn()
    };

    mockExportManager = {};

    // Set up mock implementations
    StorageManager.mockImplementation(() => mockStorageManager);
    PageManager.mockImplementation(() => mockPageManager);
    ContentEditor.mockImplementation(() => mockContentEditor);
    LineSpacingManager.mockImplementation(() => mockLineSpacingManager);
    TableOfContents.mockImplementation(() => mockTableOfContents);
    Toolbar.mockImplementation(() => mockToolbar);
    ExportManager.mockImplementation(() => mockExportManager);

    documentEngine = new DocumentEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize all managers in correct order', () => {
      expect(StorageManager).toHaveBeenCalledTimes(1);
      expect(PageManager).toHaveBeenCalledTimes(1);
      expect(LineSpacingManager).toHaveBeenCalledTimes(1);
      expect(ContentEditor).toHaveBeenCalledWith(mockLineSpacingManager);
      expect(TableOfContents).toHaveBeenCalledTimes(1);
      expect(ExportManager).toHaveBeenCalledWith(mockStorageManager);
      expect(Toolbar).toHaveBeenCalledWith(
        mockContentEditor,
        mockPageManager,
        mockTableOfContents,
        mockExportManager,
        mockStorageManager,
        mockLineSpacingManager
      );
    });

    test('should store references to all managers', () => {
      expect(documentEngine.storageManager).toBe(mockStorageManager);
      expect(documentEngine.pageManager).toBe(mockPageManager);
      expect(documentEngine.contentEditor).toBe(mockContentEditor);
      expect(documentEngine.lineSpacingManager).toBe(mockLineSpacingManager);
      expect(documentEngine.tableOfContents).toBe(mockTableOfContents);
      expect(documentEngine.toolbar).toBe(mockToolbar);
      expect(documentEngine.exportManager).toBe(mockExportManager);
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      console.log.mockRestore();
    });

    test('should initialize all components in correct order', () => {
      documentEngine.initialize();

      // Verify initialization order
      expect(mockPageManager.initialize).toHaveBeenCalledTimes(1);
      expect(mockLineSpacingManager.initialize).toHaveBeenCalledTimes(1);
      expect(mockContentEditor.initialize).toHaveBeenCalledTimes(1);
      expect(mockTableOfContents.initialize).toHaveBeenCalledTimes(1);
      expect(mockToolbar.initialize).toHaveBeenCalledTimes(1);

      // Verify order using mock.invocationCallOrder
      expect(mockPageManager.initialize.mock.invocationCallOrder[0])
        .toBeLessThan(mockLineSpacingManager.initialize.mock.invocationCallOrder[0]);
      expect(mockLineSpacingManager.initialize.mock.invocationCallOrder[0])
        .toBeLessThan(mockContentEditor.initialize.mock.invocationCallOrder[0]);
    });

    test('should setup global functions', () => {
      const setupGlobalFunctionsSpy = jest.spyOn(documentEngine, 'setupGlobalFunctions');
      
      documentEngine.initialize();

      expect(setupGlobalFunctionsSpy).toHaveBeenCalled();
      expect(mockContentEditor.setupGlobalFunctions).toHaveBeenCalled();
      expect(mockTableOfContents.setupGlobalNavigation).toHaveBeenCalled();
    });

    test('should load auto-saved document', () => {
      const loadAutoSaveSpy = jest.spyOn(documentEngine, 'loadAutoSave');
      
      documentEngine.initialize();

      expect(loadAutoSaveSpy).toHaveBeenCalled();
      expect(mockStorageManager.loadFromLocalStorage).toHaveBeenCalled();
    });

    test('should initialize document structure', () => {
      documentEngine.initialize();

      expect(mockContentEditor.initializeDocument).toHaveBeenCalled();
    });

    test('should setup auto-save', () => {
      documentEngine.initialize();

      expect(mockStorageManager.initAutoSave).toHaveBeenCalled();
    });

    test('should perform initial page overflow check after delay', () => {
      documentEngine.initialize();

      expect(mockPageManager.checkPageOverflow).not.toHaveBeenCalled();
      expect(mockTableOfContents.updateAllTOCs).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);

      expect(mockPageManager.checkPageOverflow).toHaveBeenCalled();
      expect(mockTableOfContents.updateAllTOCs).toHaveBeenCalled();
    });

    test('should log initialization messages', () => {
      documentEngine.initialize();

      expect(console.log).toHaveBeenCalledWith('Initializing Document Processor...');
      expect(console.log).toHaveBeenCalledWith('Document Processor initialized successfully!');
    });
  });

  describe('setupGlobalFunctions', () => {
    test('should setup all global functions', () => {
      documentEngine.setupGlobalFunctions();

      expect(mockContentEditor.setupGlobalFunctions).toHaveBeenCalled();
      expect(mockTableOfContents.setupGlobalNavigation).toHaveBeenCalled();
      expect(window.updateAllTOCs).toBeDefined();
      expect(typeof window.updateAllTOCs).toBe('function');
    });

    test('should make updateAllTOCs call the TableOfContents method', () => {
      documentEngine.setupGlobalFunctions();

      window.updateAllTOCs();

      expect(mockTableOfContents.updateAllTOCs).toHaveBeenCalled();
    });
  });

  describe('loadAutoSave', () => {
    beforeEach(() => {
      // Mock localStorage for these tests
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });
    });

    test('should load document from storage if exists', () => {
      const mockDoc = {
        pages: [{ pageNumber: 1, content: '<p>Test</p>' }],
        version: '3.0'
      };
      mockStorageManager.loadFromLocalStorage.mockReturnValue(mockDoc);

      documentEngine.loadAutoSave();

      expect(mockStorageManager.loadFromLocalStorage).toHaveBeenCalled();
      expect(mockToolbar.loadDocumentData).toHaveBeenCalledWith(mockDoc);
    });

    test('should check for legacy autosave if no current format exists', () => {
      mockStorageManager.loadFromLocalStorage.mockReturnValue(null);
      const legacyContent = '<p>Legacy content</p>';
      window.localStorage.getItem.mockReturnValue(legacyContent);

      documentEngine.loadAutoSave();

      expect(window.localStorage.getItem).toHaveBeenCalledWith(STORAGE_CONFIG.LEGACY_KEY);
      expect(document.getElementById('document-content').innerHTML).toBe(legacyContent);
    });

    test('should handle no saved data gracefully', () => {
      mockStorageManager.loadFromLocalStorage.mockReturnValue(null);
      window.localStorage.getItem.mockReturnValue(null);

      expect(() => documentEngine.loadAutoSave()).not.toThrow();
    });

    test('should throw error if element not found when loading legacy content', () => {
      mockStorageManager.loadFromLocalStorage.mockReturnValue(null);
      window.localStorage.getItem.mockReturnValue('<p>Legacy content</p>');
      
      // Remove the document-content element
      const contentElement = document.getElementById('document-content');
      if (contentElement) {
        contentElement.remove();
      }

      expect(() => documentEngine.loadAutoSave()).toThrow(TypeError);
    });
  });

  describe('getDocumentState', () => {
    test('should return current document state', () => {
      mockPageManager.getPageCount.mockReturnValue(3);
      mockContentEditor.isEditMode.mockReturnValue(false);
      mockLineSpacingManager.currentDefault = 1.5;
      const mockStorageInfo = {
        pages: 3,
        version: '3.0',
        lastSaved: '2024-01-01T00:00:00.000Z',
        size: 2048
      };
      mockStorageManager.getStorageInfo.mockReturnValue(mockStorageInfo);

      const state = documentEngine.getDocumentState();

      expect(state).toEqual({
        pageCount: 3,
        editMode: false,
        lineSpacing: 1.5,
        storageInfo: mockStorageInfo
      });
    });

    test('should handle missing data gracefully', () => {
      mockPageManager.getPageCount.mockReturnValue(undefined);
      mockContentEditor.isEditMode.mockReturnValue(undefined);
      mockStorageManager.getStorageInfo.mockReturnValue(null);

      const state = documentEngine.getDocumentState();

      expect(state).toEqual({
        pageCount: undefined,
        editMode: undefined,
        lineSpacing: 2,
        storageInfo: null
      });
    });
  });

  describe('clearDocument', () => {
    test('should clear storage', () => {
      documentEngine.clearDocument();

      expect(mockStorageManager.clearStorage).toHaveBeenCalled();
    });

    test('should remove all pages except first', () => {
      // Add additional pages to DOM
      const pageWrapper = document.querySelector('.page-wrapper');
      for (let i = 2; i <= 3; i++) {
        const newPage = document.createElement('div');
        newPage.className = 'document-container';
        newPage.id = `page-${i}`;
        pageWrapper.appendChild(newPage);
      }

      expect(document.querySelectorAll('.document-container').length).toBe(3);

      documentEngine.clearDocument();

      expect(document.querySelectorAll('.document-container').length).toBe(1);
      expect(document.querySelector('.document-container').id).toBe('page-1');
    });

    test('should clear first page content and reinitialize', () => {
      const firstContent = document.getElementById('document-content');
      firstContent.innerHTML = '<p>Some content</p>';

      documentEngine.clearDocument();

      expect(firstContent.innerHTML).toBe('');
      expect(mockContentEditor.initializeDocument).toHaveBeenCalled();
    });

    test('should reset page count', () => {
      mockPageManager.pageCount = 5;

      documentEngine.clearDocument();

      expect(mockPageManager.pageCount).toBe(1);
    });

    test('should update TOCs', () => {
      documentEngine.clearDocument();

      expect(mockTableOfContents.updateAllTOCs).toHaveBeenCalled();
    });

    test('should handle missing document-content element', () => {
      document.getElementById('document-content').remove();

      expect(() => documentEngine.clearDocument()).not.toThrow();
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      console.log.mockRestore();
    });

    test('should stop auto-save', () => {
      documentEngine.destroy();

      expect(mockStorageManager.stopAutoSave).toHaveBeenCalled();
    });

    test('should disconnect content observer if exists', () => {
      const mockObserver = {
        disconnect: jest.fn()
      };
      mockPageManager.contentObserver = mockObserver;

      documentEngine.destroy();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    test('should not throw if content observer is null', () => {
      mockPageManager.contentObserver = null;

      expect(() => documentEngine.destroy()).not.toThrow();
    });

    test('should log destruction message', () => {
      documentEngine.destroy();

      expect(console.log).toHaveBeenCalledWith('Document Processor destroyed');
    });
  });

  describe('auto-save interval behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should call saveToLocalStorage at specified interval', () => {
      const saveToLocalStorageSpy = jest.fn();
      mockStorageManager.saveToLocalStorage = saveToLocalStorageSpy;

      // Override initAutoSave to actually set up the interval
      mockStorageManager.initAutoSave.mockImplementation(() => {
        setInterval(() => {
          saveToLocalStorageSpy();
        }, STORAGE_CONFIG.AUTO_SAVE_INTERVAL);
      });

      documentEngine.initialize();

      // Fast-forward time by auto-save interval
      jest.advanceTimersByTime(STORAGE_CONFIG.AUTO_SAVE_INTERVAL);

      expect(saveToLocalStorageSpy).toHaveBeenCalledTimes(1);

      // Fast-forward again
      jest.advanceTimersByTime(STORAGE_CONFIG.AUTO_SAVE_INTERVAL);

      expect(saveToLocalStorageSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('version compatibility', () => {
    test('should handle v2.0 format documents', () => {
      const v2Doc = {
        pages: [{ pageNumber: 1, content: '<p>V2 content</p>' }],
        version: '2.0',
        pageCount: 1
      };
      mockStorageManager.loadFromLocalStorage.mockReturnValue(v2Doc);

      documentEngine.loadAutoSave();

      expect(mockToolbar.loadDocumentData).toHaveBeenCalledWith(v2Doc);
    });

    test('should handle v3.0 format documents', () => {
      const v3Doc = {
        pages: [{ pageNumber: 1, content: '<p>V3 content</p>' }],
        version: '3.0',
        pageCount: 1,
        defaultLineSpacing: 1.5
      };
      mockStorageManager.loadFromLocalStorage.mockReturnValue(v3Doc);

      documentEngine.loadAutoSave();

      expect(mockToolbar.loadDocumentData).toHaveBeenCalledWith(v3Doc);
    });
  });

  describe('module integration', () => {
    test('should pass line spacing manager to content editor', () => {
      const newEngine = new DocumentEngine();

      expect(ContentEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          currentDefault: expect.any(Number)
        })
      );
    });

    test('should pass storage manager to export manager', () => {
      const newEngine = new DocumentEngine();

      expect(ExportManager).toHaveBeenCalledWith(
        expect.objectContaining({
          initAutoSave: expect.any(Function),
          stopAutoSave: expect.any(Function)
        })
      );
    });

    test('should pass all required managers to toolbar', () => {
      const newEngine = new DocumentEngine();

      expect(Toolbar).toHaveBeenCalledWith(
        expect.any(Object), // contentEditor
        expect.any(Object), // pageManager
        expect.any(Object), // tableOfContents
        expect.any(Object), // exportManager
        expect.any(Object), // storageManager
        expect.any(Object)  // lineSpacingManager
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    test('should handle initialization errors gracefully', () => {
      mockPageManager.initialize.mockImplementation(() => {
        throw new Error('Page manager init error');
      });

      expect(() => documentEngine.initialize()).toThrow('Page manager init error');
    });

    test('should handle loadAutoSave errors', () => {
      mockStorageManager.loadFromLocalStorage.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => documentEngine.loadAutoSave()).toThrow('Storage error');
    });

    test('should handle clearDocument errors', () => {
      mockStorageManager.clearStorage.mockImplementation(() => {
        throw new Error('Clear storage error');
      });

      expect(() => documentEngine.clearDocument()).toThrow('Clear storage error');
    });
  });
});