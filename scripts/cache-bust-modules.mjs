/**
 * Rewrites all relative .js imports in a directory tree to include a ?v= query string.
 * This ensures ES module caches are busted on every deploy.
 *
 * Usage: node scripts/cache-bust-modules.mjs <dir> <version>
 * Example: node scripts/cache-bust-modules.mjs dist/games/dungeon-v2/src v0.3.1
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { readdirSync, statSync } from 'fs';

const [,, dir, version] = process.argv;
if (!dir || !version) {
  console.error('Usage: cache-bust-modules.mjs <dir> <version>');
  process.exit(1);
}

// Matches both static `from './foo.js'` and dynamic `import('./foo.js')`
// Handles single and double quotes, relative paths only (starts with ./ or ../)
const IMPORT_RE = /(from\s+['"]|import\s*\(['"])(\.{1,2}\/[^'"]+\.js)(['"]\)?)/g;

let count = 0;

function walk(d) {
  for (const entry of readdirSync(d)) {
    const full = join(d, entry);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    if (!entry.endsWith('.js')) continue;

    const original = readFileSync(full, 'utf8');
    const rewritten = original.replace(IMPORT_RE, (_, prefix, path, suffix) => {
      // Don't double-add a query string
      if (path.includes('?')) return prefix + path + suffix;
      return `${prefix}${path}?v=${version}${suffix}`;
    });

    if (rewritten !== original) {
      writeFileSync(full, rewritten, 'utf8');
      count++;
    }
  }
}

walk(dir);
console.log(`cache-bust-modules: rewrote ${count} file(s) with ?v=${version}`);
