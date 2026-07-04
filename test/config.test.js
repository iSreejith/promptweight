import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, normalizeConfig, DEFAULT_WATCH, INPUT_PRICE_PER_MTOK } from '../src/config.js';

test('defaults when config file missing', () => {
  const cfg = loadConfig(join(mkdtempSync(join(tmpdir(), 'pw-')), 'nope.json'));
  assert.equal(cfg.model, 'claude-opus-4-8');
  assert.equal(cfg.requestsPerMonth, null);
  assert.equal(cfg.budgets, null);
});

test('loadConfig parses a real file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-'));
  const p = join(dir, '.promptweight.json');
  writeFileSync(p, JSON.stringify({
    model: 'claude-sonnet-5', requestsPerMonth: 10000,
    budgets: [{ path: 'CLAUDE.md', maxTokens: 1500 }, { path: '.claude/**/*.md' }],
  }));
  const cfg = loadConfig(p);
  assert.equal(cfg.model, 'claude-sonnet-5');
  assert.equal(cfg.requestsPerMonth, 10000);
  assert.deepEqual(cfg.budgets, [
    { path: 'CLAUDE.md', maxTokens: 1500 },
    { path: '.claude/**/*.md', maxTokens: null },
  ]);
});

test('malformed JSON and invalid shapes throw with the source name', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-'));
  const p = join(dir, 'bad.json');
  writeFileSync(p, '{not json');
  assert.throws(() => loadConfig(p), /bad\.json/);
  assert.throws(() => normalizeConfig([]), /must be an object/);
  assert.throws(() => normalizeConfig({ budgets: 'x' }), /budgets must be an array/);
  assert.throws(() => normalizeConfig({ budgets: [{ maxTokens: 5 }] }), /path must be a string/);
  assert.throws(() => normalizeConfig({ budgets: [{ path: 'a', maxTokens: -1 }] }), /positive integer/);
  assert.throws(() => normalizeConfig({ requestsPerMonth: 0 }), /positive number/);
});

test('constants exist', () => {
  assert.ok(DEFAULT_WATCH.includes('CLAUDE.md'));
  assert.equal(typeof INPUT_PRICE_PER_MTOK['claude-opus-4-8'], 'number');
});
