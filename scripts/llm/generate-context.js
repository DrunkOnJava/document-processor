#!/usr/bin/env node

/**
 * @file generate-context.js
 * @description Simplified context generator for document-processor
 * @module scripts/llm
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function generateContext() {
  console.log('🤖 Generating LLM context for document-processor...\n');
  
  try {
    // Load package.json
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    // Get git info
    let gitInfo = { branch: 'unknown', commit: 'unknown' };
    try {
      gitInfo.branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      gitInfo.commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {}
    
    // Build context
    const context = {
      version: pkg.version,
      generated: new Date().toISOString(),
      generator: 'scripts/llm/generate-context.js',
      
      project: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        repository: pkg.repository?.url || ''
      },
      
      git: gitInfo,
      
      architecture: {
        pattern: 'modular',
        entry: 'src/js/index.js',
        modules: [
          'DocumentEngine - Core orchestrator',
          'PageManager - Pagination and overflow handling',
          'ContentEditor - Rich text editing',
          'TableOfContents - TOC generation',
          'ExportManager - Multiple format exports',
          'StorageManager - Local storage and auto-save'
        ]
      },
      
      key_features: [
        'US Letter format (8.5" × 11") with 1-inch margins',
        'Automatic pagination with content overflow',
        'Rich text editing with contentEditable',
        'Multiple line spacing options',
        'Table of Contents generation',
        'Export to JSON/HTML/Markdown',
        'Auto-save to localStorage'
      ],
      
      critical_constraints: [
        'Must maintain exact page dimensions',
        'Pagination logic is core functionality',
        'Backward compatibility with saved documents',
        'Keep-with-next for headings and tables'
      ]
    };
    
    // Write context as YAML
    const yaml = require('js-yaml');
    const yamlContent = yaml.dump(context, { lineWidth: 120 });
    await fs.writeFile('.llm-context', yamlContent);
    
    console.log('✅ LLM context generated successfully!');
    console.log(`📄 Written to: .llm-context`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateContext();
}

module.exports = { generateContext };