import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers/loadGame.js';

function freshGame(overrides = {}) {
  const sandbox = loadGame();
  sandbox.__setS({
    v: 1, t: 100, tech: [], district: [],
    res: { food: 1000, wood: 1000, stone: 1000, iron: 1000, gold: 1000 },
    goods: {}, flags: {}, sat: { scholars: 50 }, stats: { tradeVol: 0 },
    b: { academy: 3 }, rs: null, rsNext: null, bloc: null, site: 'plains', spec: null, chron: [],
    ...overrides,
  });
  return sandbox;
}

test('queueResearch: rejects a tech that is already completed', () => {
  const s = freshGame({ tech: ['crop'] });
  const err = s.queueResearch('crop');
  assert.equal(err, 'נחקר');
});

test('queueResearch: rejects a tech that is already the active research', () => {
  const s = freshGame({ rs: { id: 'tools', end: 108, start: 100 } });
  const err = s.queueResearch('tools');
  assert.match(err, /כבר מתבצע/);
});

test('queueResearch: rejects a locked tech (academy level too low)', () => {
  const s = freshGame({ b: { academy: 1 } }); // 'ocean' is tier 3
  const err = s.queueResearch('ocean');
  assert.ok(err);
});

test('queueResearch: accepts a valid tech and sets S.rsNext without starting it', () => {
  const s = freshGame({ rs: { id: 'tools', end: 108, start: 100 } });
  const err = s.queueResearch('crop');
  assert.equal(err, null);
  assert.equal(s.__getS().rsNext, 'crop');
  assert.equal(s.__getS().rs.id, 'tools', 'the active research is untouched');
});

test('unqueueResearch: clears S.rsNext', () => {
  const s = freshGame({ rsNext: 'crop' });
  s.unqueueResearch();
  assert.equal(s.__getS().rsNext, null);
});

test('processResearch: completing the active research auto-starts the queued one', () => {
  const s = freshGame({
    rs: { id: 'tools', end: 100, start: 92 }, // end has already passed (S.t=100)
    rsNext: 'crop',
  });
  s.processResearch();
  const state = s.__getS();
  assert.ok(state.tech.includes('tools'), 'tools should now be completed');
  assert.equal(state.rsNext, null, 'the queue slot is cleared');
  assert.equal(state.rs.id, 'crop', 'crop should now be the active research');
});

test('processResearch: a queued tech that became invalid in the meantime is silently dropped, not force-started', () => {
  const s = freshGame({
    rs: { id: 'tools', end: 100, start: 92 },
    rsNext: 'ocean', // requires academy 3+ and site==='coast'; site is 'plains' here
  });
  s.processResearch();
  const state = s.__getS();
  assert.ok(state.tech.includes('tools'));
  assert.equal(state.rsNext, null);
  assert.equal(state.rs, null, 'ocean could not start, so nothing is researching');
});

test('processResearch: does nothing before the active research end time', () => {
  const s = freshGame({ rs: { id: 'tools', end: 200, start: 100 } });
  s.processResearch();
  const state = s.__getS();
  assert.deepEqual(state.tech, []);
  assert.equal(state.rs.id, 'tools');
});
