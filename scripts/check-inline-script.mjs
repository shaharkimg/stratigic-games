import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];

if (scripts.length !== 1) {
  throw new Error(`Expected exactly one inline game script, found ${scripts.length}`);
}

// Compile without executing. This catches syntax errors in the production
// game code, which ESLint previously skipped because it lives in HTML.
new vm.Script(scripts[0][1], { filename: 'index.html:inline-script' });
console.log('Inline game script syntax is valid.');
