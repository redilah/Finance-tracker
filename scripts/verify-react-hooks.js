import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const REACT_HOOKS = [
  'useState',
  'useEffect',
  'useRef',
  'useMemo',
  'useCallback',
  'useContext',
  'useReducer',
  'useId',
  'useTransition',
  'useDeferredValue',
  'useImperativeHandle',
  'useLayoutEffect',
  'useSyncExternalStore'
];

function getAllFiles(dir, extensions = ['.jsx', '.js']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function verifyFileHooks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  // 1. Cari semua React hook yang diimpor dari 'react'
  // Regex untuk menangkap: import ... from 'react' (bisa multiline)
  const reactImportMatches = content.match(/import\s+(?:(?:\*\s+as\s+\w+)|(?:[\w\s,{}]+))\s+from\s+['"]react['"]/g) || [];
  const importedHooks = new Set();
  let hasReactDefaultOrNamespace = false;

  for (const imp of reactImportMatches) {
    if (imp.includes('* as') || /import\s+React\s+from/.test(imp)) {
      hasReactDefaultOrNamespace = true;
    }
    const namedPartMatch = imp.match(/\{([^}]+)\}/);
    if (namedPartMatch) {
      namedPartMatch[1]
        .split(',')
        .map(s => s.trim().split(/\s+as\s+/).pop().trim())
        .forEach(h => importedHooks.add(h));
    }
  }

  // 2. Scan setiap baris untuk pemanggilan hook
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Abaikan baris komentar
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    for (const hook of REACT_HOOKS) {
      // Pola: kata utuh hook diikuti '(', tapi BUKAN diawali dengan 'React.'
      const regex = new RegExp(`(?<![.\\w])${hook}\\s*\\(`, 'g');
      let match;
      while ((match = regex.exec(line)) !== null) {
        // Pastikan bukan definisi lokal (const useState = ..., function useRef ...)
        const isDefinition = new RegExp(`(?:const|let|var|function)\\s+${hook}\\b`).test(line);
        if (isDefinition) continue;

        // Jika hook tidak diimpor dari react, catat sebagai error
        if (!importedHooks.has(hook)) {
          errors.push({
            hook,
            line: i + 1,
            codeSnippet: line.trim()
          });
        }
      }
    }
  }

  return errors;
}

console.log('🔍 Checking React hook imports across src/ directory...');
const files = getAllFiles(srcDir);
let totalErrors = 0;
const errorDetails = [];

for (const file of files) {
  const fileErrors = verifyFileHooks(file);
  if (fileErrors.length > 0) {
    totalErrors += fileErrors.length;
    const relPath = path.relative(rootDir, file);
    errorDetails.push({ relPath, fileErrors });
  }
}

if (totalErrors > 0) {
  console.error('\n❌ ERROR: Unimported React Hooks detected!\n');
  for (const { relPath, fileErrors } of errorDetails) {
    console.error(`📁 ${relPath}:`);
    for (const err of fileErrors) {
      console.error(`   - Line ${err.line}: "${err.hook}" is called but NOT imported from 'react'!`);
      console.error(`     Snippet: ${err.codeSnippet}`);
    }
  }
  console.error(`\nTotal violations: ${totalErrors}. Please add the missing hook(s) to the React import statement.\n`);
  process.exit(1);
} else {
  console.log(`✅ Success! Verified ${files.length} source files: 0 missing React hook imports found.\n`);
  process.exit(0);
}
