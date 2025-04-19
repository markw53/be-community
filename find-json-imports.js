// find-json-imports.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directories to exclude
const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];

// Function to search for JSON imports in a file
function searchFileForJsonImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonImportRegex = /import\s+.*\s+from\s+['"](.+\.json)['"]\s*;/g;
    
    let match;
    const matches = [];
    
    while ((match = jsonImportRegex.exec(content)) !== null) {
      matches.push({
        file: filePath,
        importPath: match[1],
        fullMatch: match[0]
      });
    }
    
    return matches;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Function to recursively search directories
function searchDirectory(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        results = results.concat(searchDirectory(filePath));
      }
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.mjs'))) {
      const fileResults = searchFileForJsonImports(filePath);
      results = results.concat(fileResults);
    }
  }
  
  return results;
}

// Start the search
const results = searchDirectory(__dirname);

if (results.length === 0) {
  console.log('No direct JSON imports found.');
} else {
  console.log(`Found ${results.length} direct JSON imports that need to be fixed:`);
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. File: ${result.file}`);
    console.log(`   Import: ${result.importPath}`);
    console.log(`   Current: ${result.fullMatch}`);
    console.log(`   Fix: import ... from '${result.importPath}' with { type: 'json' };`);
  });
}