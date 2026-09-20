import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers/loadGame.js';

function game(overrides = {}) {
  const sandbox = loadGame();
  sandbox.__setS({
    t: 100,
    tech: [],
    district: [],
    res: { food: 2000, wood: 2000, stone: 2000, iron: 2000, gold: 2000 },
    goods: { horses: 20, salt: 0, wine: 0, spices: 0 },
    b: {
      townhall: 3, academy: 2, barracks: 2, stable: 1,
      granary: 0, warehouse: 0, port: 0,
    },
    units: { spear: 0, archer: 0, sword: 0, scout: 0, lcav: 0, hcav: 0, ram: 0, cata: 0 },
    rq: [],
    queue: [],
    moves: [],
    outposts: [],
    pop: 200,
    flags: {},
    arts: {},
    stats: { built: 0 },
    sat: { scholars: 50 },
    spec: null,
    specAt: 0,
    bloc: null,
    nation: null,
    ...overrides,
  });
  return sandbox;
}

test('research cannot start when another research is active', () => {
  const s = game({ rs: { id: 'masonry', start: 90, end: 110 } });
  assert.equal(s.startResearch('roads'), 'מחקר אחר כבר מתבצע');
});

test('starting available research deducts its cost and creates a timed job', () => {
  const s = game({ rs: null });
  const before = { ...s.__getS().res };
  assert.equal(s.startResearch('masonry'), null);
  const state = s.__getS();
  assert.equal(state.rs.id, 'masonry');
  assert.ok(state.rs.end > state.t);
  assert.ok(Object.keys(before).some(key => state.res[key] < before[key]));
});

test('recruit rejects a force that would leave fewer than 40 citizens', () => {
  const s = game({ pop: 45 });
  assert.equal(s.recruit('spear', 10), 'לא נשארו מספיק אזרחים');
  assert.equal(s.__getS().rq.length, 0);
});

test('valid recruitment moves citizens into the training queue', () => {
  const s = game({ pop: 200 });
  assert.equal(s.recruit('spear', 10), null);
  const state = s.__getS();
  assert.equal(state.pop, 190);
  assert.equal(state.rq.length, 1);
  assert.equal(state.rq[0].u, 'spear');
  assert.equal(state.rq[0].n, 10);
});

test('resource capacity grows with the matching storage building', () => {
  const s = game();
  assert.equal(s.cap('food'), 700);
  assert.equal(s.cap('wood'), 700);
  s.__getS().b.granary = 2;
  s.__getS().b.warehouse = 3;
  assert.equal(s.cap('food'), 1700);
  assert.equal(s.cap('wood'), 2200);
});
