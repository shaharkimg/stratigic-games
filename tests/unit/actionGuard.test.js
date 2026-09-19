import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers/loadGame.js';

function freshGame() {
  const sandbox = loadGame();
  sandbox.__setS({
    v: 1, t: 100,
    res: { food: 100, wood: 50, stone: 20, iron: 0, gold: 500 },
    goods: {},
    b: { market: 1, granary: 0, warehouse: 0 },
  });
  return sandbox;
}

test('ActionGuard.check: sufficient resources and requirements -> canExecute', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({ cost: { wood: 20, gold: 100 } });
  assert.equal(res.canExecute, true);
  assert.equal(res.missingResources.length, 0);
  assert.equal(res.userMessage, null);
});

test('ActionGuard.check: insufficient single resource reports it with have/need', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({ cost: { iron: 30 } });
  assert.equal(res.canExecute, false);
  assert.equal(res.missingResources.length, 1);
  assert.equal(res.missingResources[0].key, 'iron');
  assert.equal(res.missingResources[0].have, 0);
  assert.equal(res.missingResources[0].need, 30);
  assert.match(res.userMessage, /ברזל/);
});

test('ActionGuard.check: multiple missing resources are all reported', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({ cost: { iron: 30, stone: 999 } });
  assert.equal(res.canExecute, false);
  assert.equal(res.missingResources.length, 2);
});

test('ActionGuard.check: unmet requirement blocks even with affordable cost', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({
    cost: { wood: 10 },
    requirements: [{ ok: false, label: 'דרוש מרכז כפר רמה 3' }],
  });
  assert.equal(res.canExecute, false);
  assert.equal(res.userMessage, 'דרוש מרכז כפר רמה 3');
});

test('ActionGuard.check: satisfied requirement does not block', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({
    requirements: [{ ok: true, label: 'should not appear' }],
  });
  assert.equal(res.canExecute, true);
});

test('ActionGuard.check: expired offer is blocked with a specific message', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({ expiry: { at: 50, now: 100 } });
  assert.equal(res.canExecute, false);
  assert.equal(res.userMessage, 'ההצעה פגה');
});

test('ActionGuard.check: not-yet-expired offer is not blocked', () => {
  const s = freshGame();
  const res = s.ActionGuard.check({ expiry: { at: 150, now: 100 } });
  assert.equal(res.canExecute, true);
});

test('ActionGuard.check: no args at all is trivially executable', () => {
  const s = freshGame();
  const res = s.ActionGuard.check();
  assert.equal(res.canExecute, true);
});
