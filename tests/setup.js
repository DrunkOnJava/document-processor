/**
 * @file setup.js
 * @description Jest test setup and global configuration
 */

// Mock DOM APIs that jsdom doesn't provide
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn().mockReturnValue([])
}));

// Mock window.getComputedStyle
global.getComputedStyle = jest.fn().mockImplementation(() => ({
  width: '6.5in',
  height: '9in',
  fontSize: '12pt',
  lineHeight: '1.6'
}));

// Mock document.execCommand
document.execCommand = jest.fn().mockReturnValue(true);

// Mock window.getSelection
global.getSelection = jest.fn().mockImplementation(() => ({
  rangeCount: 0,
  getRangeAt: jest.fn(),
  removeAllRanges: jest.fn(),
  addRange: jest.fn(),
  containsNode: jest.fn().mockReturnValue(false)
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  result: null,
  onload: null,
  onerror: null
}));

// Mock prompt and confirm
global.prompt = jest.fn();
global.confirm = jest.fn(() => true);

// Set up DOM structure for tests
beforeEach(() => {
  document.body.innerHTML = `
    <div class="page-wrapper">
      <div class="document-container" id="page-1">
        <div class="margin-guides"></div>
        <div class="page-info">Page 1 | US Letter (8.5" × 11")</div>
        <div id="document-content" class="editable-content" contenteditable="true"></div>
      </div>
    </div>
    <div id="status"></div>
    <select id="lineSpacingSelect">
      <option value="1">Single</option>
      <option value="1.5">1.5</option>
      <option value="2" selected>Double</option>
    </select>
  `;
  
  // Clear all mocks
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});

// Custom matchers
expect.extend({
  toHavePixelHeight(received, expected) {
    const pass = received.style.height === expected || 
                 received.style.minHeight === expected ||
                 received.style.maxHeight === expected;
    return {
      pass,
      message: () => `expected element to have height ${expected}, but got ${received.style.height}`
    };
  },
  
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () => `expected element to have class "${className}"`
    };
  }
});