# Tests

The game is a single static file (`index.html`) with one big inline
`<script>` — there is no bundler, no modules, and this change intentionally
does not introduce one (see the plan for PR #1: the goal is to add tests
*around* the existing file, not to refactor it into modules).

## Unit tests (`tests/unit/`)

Run with `npm test` (Node's built-in test runner, no extra dependency).

`tests/unit/helpers/loadGame.js` extracts the inline `<script>` from
`index.html` and runs it in a Node `vm` context with minimal DOM/localStorage
stubs. Because the script is a classic (non-module) script, top-level
`const`/`let` bindings are **not** visible outside it — only `function`
declarations and anything explicitly attached to `window` are. The pieces
meant to be unit-testable (`ActionGuard`, `migrateSave`) deliberately do:

```js
if (typeof window !== 'undefined') window.ActionGuard = ActionGuard;
```

right after their definition, purely so tests can reach them. This has no
effect on the browser build (`window` already exists there too).

If you add a new pure function you want unit-tested, follow the same
pattern rather than restructuring surrounding code.

## E2E tests (`tests/e2e/`)

Run with `npm run test:e2e` (Playwright). Tests load `index.html` directly
via `file://` — the same way it's actually deployed (a static file, no
server) — so what passes here is representative of production.

Playwright is configured (`playwright.config.js`) with four projects:
desktop Chromium plus three mobile/tablet viewports (360×800, 390×844,
768×1024) used by the responsive-layout checks.

## What's intentionally NOT covered yet

Research, army, diplomacy and government screens are not covered by this
PR's tests (their ActionGuard wiring is deferred to a later PR per the
roadmap in the plan file). City building, market, plot accessibility and
save migration are the scope of PR #1 and are covered.
