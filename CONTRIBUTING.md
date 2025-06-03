# Contributing to Document Processor

Thank you for your interest in contributing to Document Processor! This guide will help you understand our development process and coding standards, optimized for both human developers and AI assistants.

## 🤖 LLM-Friendly Development

This project follows LLM-optimized patterns to ensure AI assistants can effectively understand and contribute to the codebase.

### Key Principles
1. **Clear Context**: Every file includes comprehensive headers
2. **Self-Documenting**: Code explains its purpose and behavior
3. **Modular Structure**: Small, focused files under 500 lines
4. **Type Safety**: JSDoc types for all functions and data
5. **Consistent Patterns**: Predictable code organization

## 📋 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- Modern browser (Chrome, Firefox, Safari, Edge)
- Code editor with JSDoc support (VS Code recommended)

### Setup
```bash
# Clone the repository
git clone https://github.com/DrunkOnJava/document-processor.git
cd document-processor

# Install dependencies (after modularization)
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 🏗️ Project Structure

```
document-processor/
├── src/
│   ├── js/              # JavaScript modules
│   ├── styles/          # CSS files
│   ├── types/           # TypeScript definitions
│   └── assets/          # Images, fonts, etc.
├── docs/
│   ├── api/             # API documentation
│   ├── components/      # Component guides
│   └── decisions/       # Architecture Decision Records
├── tests/               # Test files
├── scripts/             # Build and utility scripts
└── dist/                # Production builds
```

## 💻 Development Guidelines

### Code Style

#### JavaScript
```javascript
/**
 * @file ComponentName.js
 * @description Brief description of component purpose
 * @author Your Name
 * @version 1.0.0
 */

// Use descriptive names
const userAuthenticationToken = generateToken();

// Not this
const token = genTok();

// Clear function signatures with JSDoc
/**
 * Validates user input for document title
 * @param {string} title - Document title to validate
 * @returns {Object} Validation result
 * @returns {boolean} result.isValid - Whether title is valid
 * @returns {string} [result.error] - Error message if invalid
 */
function validateDocumentTitle(title) {
  if (!title || title.trim().length === 0) {
    return { 
      isValid: false, 
      error: 'Title cannot be empty' 
    };
  }
  
  if (title.length > 255) {
    return { 
      isValid: false, 
      error: 'Title cannot exceed 255 characters' 
    };
  }
  
  return { isValid: true };
}
```

#### CSS
```css
/* Component-specific styles */
.document-page {
  /* US Letter dimensions */
  width: 8.5in;
  height: 11in;
  
  /* Standard margins */
  padding: 1in;
  
  /* Visual design */
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* State modifiers */
.document-page--editing {
  outline: 2px solid var(--primary-color);
}

/* Responsive behavior */
@media print {
  .document-page {
    box-shadow: none;
    margin: 0;
  }
}
```

### Commit Messages

Follow conventional commits format:
```
feat: add PDF export functionality
fix: correct page overflow calculation
docs: update API documentation for PageManager
refactor: split DocumentEngine into smaller modules
test: add unit tests for TableOfContents
style: format code according to prettier rules
```

### Testing Requirements

Every new feature must include:
1. Unit tests with >80% coverage
2. Integration tests for complex interactions
3. Example usage in test files

```javascript
// Example test structure
describe('FeatureName', () => {
  // Setup and teardown
  beforeEach(() => {
    // Test setup
  });

  // Group related tests
  describe('methodName()', () => {
    it('should handle normal input correctly', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases gracefully', () => {
      // Test edge cases
    });
  });
});
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Add/update JSDoc comments
   - Update relevant .md files
   - Include examples in comments

2. **Run Quality Checks**
   ```bash
   npm run lint        # Check code style
   npm run test        # Run all tests
   npm run build       # Ensure builds work
   ```

3. **Self-Review Checklist**
   - [ ] Files under 500 lines
   - [ ] Clear file headers with purpose
   - [ ] JSDoc for all public functions
   - [ ] Tests for new functionality
   - [ ] No hardcoded values
   - [ ] Error handling implemented

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Changes Made
- Specific change 1
- Specific change 2

## Testing
- How to test the changes
- What to verify

## Documentation
- [ ] Updated JSDoc comments
- [ ] Updated README if needed
- [ ] Added to CHANGELOG

## LLM Context
Key information for AI assistants:
- Main files modified
- New patterns introduced
- Dependencies changed
```

## 🎯 Areas for Contribution

### High Priority
1. **Modularization**: Help split the monolithic file
2. **TypeScript**: Add type definitions
3. **Testing**: Increase test coverage
4. **Documentation**: Improve inline docs

### Feature Requests
- PDF export functionality
- Collaborative editing
- Cloud storage integration
- Custom templates
- Accessibility improvements

### Good First Issues
Look for issues labeled `good first issue` or `help wanted`.

## 📚 Resources

### Documentation
- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./docs/api/)
- [Component Guides](./docs/components/)

### Learning Materials
- [MDN ContentEditable](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [JSDoc Reference](https://jsdoc.app/)

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Document your code thoroughly
- Consider AI assistants as part of the development team

### LLM Integration
When working with AI assistants:
- Provide clear context in your questions
- Share relevant file paths and function names
- Include error messages and logs
- Specify the desired outcome clearly

## 📞 Getting Help

- **Issues**: Open a GitHub issue for bugs or features
- **Discussions**: Use GitHub Discussions for questions
- **Email**: [your-email@example.com]

## 🙏 Recognition

Contributors will be added to:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- Project README
- Release notes

Thank you for helping make Document Processor better for everyone!