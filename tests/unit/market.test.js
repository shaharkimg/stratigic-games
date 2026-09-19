import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers/loadGame.js';

function freshGame(overrides = {}) {
  const sandbox = loadGame();
  sandbox.__setS({
    v: 1, t: 100, tech: [], district: [],
    res: { food: 100, wood: 50, stone: 20, iron: 0, gold: 500 },
    goods: {},
    b: { market: 1, granary: 0, warehouse: 0 },
    market: { wood: { p: 20, b: 20 } }, // price stored per-10-units
    stats: { tradeVol: 0 },
    flags: {},
    bloc: null,
    ...overrides,
  });
  return sandbox;
}

test('mktUnit: derives per-unit price from the stored per-10 price', () => {
  const s = freshGame();
  assert.equal(s.mktUnit('wood'), 2); // 20 / 10
});

test('mktQuote: sell total is gross minus fee', () => {
  const s = freshGame();
  const q = s.mktQuote('wood', 'sell', 50);
  const fee = s.fee();
  assert.equal(q.gross, 100); // 50 * unit(2)
  assert.ok(Math.abs(q.total - 100 * (1 - fee)) < 1e-9);
});

test('mktQuote: buy total is gross plus fee', () => {
  const s = freshGame();
  const q = s.mktQuote('wood', 'buy', 50);
  const fee = s.fee();
  assert.equal(q.gross, 100);
  assert.ok(Math.abs(q.total - 100 * (1 + fee)) < 1e-9);
});

test('mktMax: sell max is capped at what you actually have', () => {
  const s = freshGame();
  assert.equal(s.mktMax('wood', 'sell'), 50); // S.res.wood = 50
});

test('mktMax: buy max is capped by gold available', () => {
  const s = freshGame({
    res: { food: 100, wood: 0, stone: 20, iron: 0, gold: 21 },
    b: { market: 1, granary: 0, warehouse: 0 },
    market: { wood: { p: 20, b: 20 } },
  });
  // unit=2, with fee ~10% -> unitWithFee ~2.2, 21/2.2 ~= 9
  const max = s.mktMax('wood', 'buy');
  assert.ok(max >= 8 && max <= 10, `expected ~9, got ${max}`);
});

test('mktMax: buy max is capped by warehouse space, not just gold', () => {
  const s = freshGame({
    res: { food: 100, wood: 690, stone: 20, iron: 0, gold: 1e6 },
    b: { market: 1, granary: 0, warehouse: 0 }, // cap(wood) = 700
    market: { wood: { p: 20, b: 20 } },
  });
  assert.equal(s.mktMax('wood', 'buy'), 10); // 700 - 690
});

test('mkt(): selling more than you have is rejected, state unchanged', () => {
  const s = freshGame();
  const err = s.mkt('wood', 'sell', 999);
  assert.ok(err);
  assert.equal(s.__getS().res.wood, 50);
});

test('mkt(): buying beyond warehouse capacity is rejected', () => {
  const s = freshGame({
    res: { food: 100, wood: 695, stone: 20, iron: 0, gold: 1e6 },
    b: { market: 1, granary: 0, warehouse: 0 },
    market: { wood: { p: 20, b: 20 } },
  });
  const err = s.mkt('wood', 'buy', 50);
  assert.ok(err);
  assert.equal(s.__getS().res.wood, 695);
});

test('mkt(): a valid sell moves resources to gold', () => {
  const s = freshGame();
  const goldBefore = s.__getS().res.gold;
  const err = s.mkt('wood', 'sell', 50);
  assert.equal(err, null);
  assert.equal(s.__getS().res.wood, 0);
  assert.ok(s.__getS().res.gold > goldBefore);
});
