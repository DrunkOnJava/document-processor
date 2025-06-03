#!/usr/bin/env node

/**
 * @file validate-context.js
 * @description Simplified validator for document-processor
 * @module scripts/llm
 */

const fs = require('fs').promises;
const path = require('path');

async function validateContext() {
  console.log('🔍 Validating document-processor structure...\n');
  
  let errors = 0;
  let warnings = 0;
  
  try {
    // Check for .llm-context
    try {
      await fs.access('.llm-context');
      console.log('✅ Found .llm-context file');
    } catch {
      console.log('❌ Missing .llm-context file');
      errors++;
    }
    
    // Check project structure
    const requiredDirs = [
      'src/js/core',
      'src/js/components',
      'src/js/utils',
      'src/js/export',
      'src/styles',
      'scripts/llm',
      'docs',
      'tests'
    ];
    
    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`✅ Directory exists: ${dir}`);
      } catch {
        console.log(`⚠️  Missing directory: ${dir}`);
        warnings++;
      }
    }
    
    // Check for critical files
    const criticalFiles = [
      'package.json',
      '.llm-ignore',
      '.claude-code.yaml',
      'README.md'
    ];
    
    for (const file of criticalFiles) {
      try {
        await fs.access(file);
        console.log(`✅ Found ${file}`);
      } catch {
        console.log(`❌ Missing ${file}`);
        errors++;
      }
    }
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`   Errors: ${errors}`);
    console.log(`   Warnings: ${warnings}`);
    
    if (errors === 0) {
      console.log('\n✅ Validation passed!');
      return 0;
    } else {
      console.log('\n❌ Validation failed!');
      return 1;
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return 1;
  }
}

// Run if called directly
if (require.main === module) {
  validateContext().then(code => process.exit(code));
}

module.exports = { validateContext };