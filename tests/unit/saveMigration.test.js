import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers/loadGame.js';

test('migrateSave: current-shape save is a no-op (only sets v if missing)', () => {
  const { migrateSave } = loadGame();
  const save = { v: 1, b: { castle: 3, townhall: 1 }, spec: null, specAt: 0, plot: { townhall: 'townhall' }, rsNext: null };
  const before = JSON.stringify(save);
  const out = migrateSave(save);
  assert.equal(JSON.stringify(save), before, 'should not mutate an already-current save beyond what migration steps touch');
  assert.equal(out.v, 1);
});

test('migrateSave: legacy save missing S.plot gets backfilled from built buildings', () => {
  const { migrateSave } = loadGame();
  const save = { v: 1, b: { castle: 0, townhall: 2, market: 1 } };
  const out = migrateSave(save);
  assert.ok(out.plot, 'plot map should be created');
  assert.equal(out.plot.townhall, 'townhall');
  assert.equal(out.plot.market, 'market');
  assert.equal(out.plot.castle, undefined, 'unbuilt (level 0) buildings should not get a plot');
});

test('migrateSave: legacy save missing S.spec gets default null/0', () => {
  const { migrateSave } = loadGame();
  const save = { v: 1, b: { castle: 1 } };
  const out = migrateSave(save);
  assert.equal(out.spec, null);
  assert.equal(out.specAt, 0);
});

test('migrateSave: legacy save missing S.rsNext (pre-research-queue) gets defaulted to null', () => {
  const { migrateSave } = loadGame();
  const save = { v: 1, b: { castle: 1 } };
  const out = migrateSave(save);
  assert.equal(out.rsNext, null);
});

test('migrateSave: pre-versioned save (no v field) runs migration and gets stamped', () => {
  const { migrateSave } = loadGame();
  const save = { b: { castle: 0 } };
  const out = migrateSave(save);
  assert.equal(out.v, 1);
  // out.plot is an object created inside the vm sandbox realm, so it has a
  // different Object.prototype than {} here — compare by serialized shape.
  assert.equal(JSON.stringify(out.plot), '{}');
});

test('migrateSave: null/garbage input returns null instead of throwing', () => {
  const { migrateSave } = loadGame();
  assert.equal(migrateSave(null), null);
  assert.equal(migrateSave(undefined), null);
  assert.equal(migrateSave({}), null, 'object with no .b is treated as not a valid save');
  assert.equal(migrateSave('not an object'), null);
});
