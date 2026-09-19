// Loads index.html's inline <script> into a Node vm context so pure logic
// (ActionGuard, save migration, market math) can be unit-tested without a
// browser. The game is a single classic (non-module) script, so top-level
// `const`/`let` bindings are NOT visible on the context object by default —
// only `function` declarations and anything explicitly attached to
// `window`/`globalThis` are. Testable pieces (ActionGuard, migrateSave, ...)
// deliberately do `if (typeof window !== 'undefined') window.X = X;` right
// after their definition for exactly this reason — see index.html.
//
// This is a workaround, not a real module boundary: the game was never
// split into modules, and doing so is out of scope for this change. See
// tests/README.md.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = path.join(__dirname, '../../../index.html');

function extractScript(html) {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Could not find inline <script> in index.html');
  return m[1];
}

class MemoryStorage {
  constructor() { this.store = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

// Minimal DOM/browser shims: enough for the script's top-level setup code
// (which calls document.querySelector, addEventListener, etc.) to run
// without throwing. We are not testing rendering here, only pure logic
// reachable after the script finishes loading.
function makeStubElement() {
  const el = {
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {},
    children: [],
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    insertAdjacentHTML() {},
    querySelector: () => makeStubElement(),
    querySelectorAll: () => [],
    setAttribute() {},
    getAttribute: () => null,
    remove() {},
  };
  Object.defineProperty(el, 'innerHTML', { get() { return this._html || ''; }, set(v) { this._html = v; } });
  return el;
}

export function loadGame({ withSavedData } = {}) {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const script = extractScript(html);

  const storage = new MemoryStorage();
  if (withSavedData) storage.setItem('empires_riverlands_v1', JSON.stringify(withSavedData));

  const sandbox = {
    console,
    localStorage: storage,
    document: {
      documentElement: { style: { setProperty() {} } },
      getElementById: () => makeStubElement(),
      querySelector: () => makeStubElement(),
      querySelectorAll: () => [],
      addEventListener() {},
      body: makeStubElement(),
      createElementNS: () => makeStubElement(),
    },
    navigator: { language: 'he' },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
    setInterval: () => 0,
    clearInterval() {},
    setTimeout: () => 0,
    clearTimeout() {},
    confirm: () => true,
    alert() {},
    location: { href: 'file:///index.html' },
    Math,
    JSON,
    Date,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  try {
    vm.runInContext(script, context, { filename: 'index.html-inline-script.js' });
  } catch (e) {
    // Some top-level init code touches the DOM in ways our stubs don't
    // fully cover; testable exports are attached to `window` before any
    // such code runs (see comment above), so surviving that far is enough.
    if (!sandbox.__gameLoadError) sandbox.__gameLoadError = e;
  }
  return sandbox;
}
