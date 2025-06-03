module.exports = {
  // Line length
  printWidth: 100,
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Semicolons
  semi: true,
  
  // Quotes
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // Trailing commas
  trailingComma: 'only-multiline',
  
  // Brackets
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'always',
  
  // Line endings
  endOfLine: 'lf',
  
  // HTML/JSX
  htmlWhitespaceSensitivity: 'css',
  
  // Markdown
  proseWrap: 'preserve',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Overrides for specific file types
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.json',
      options: {
        printWidth: 80
      }
    },
    {
      files: '*.yml',
      options: {
        singleQuote: false
      }
    }
  ]
};