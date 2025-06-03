/**
 * @file jest.config.js
 * @description Jest configuration for document processor testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/js/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/index.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  },
  
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Verbose output
  verbose: true
};