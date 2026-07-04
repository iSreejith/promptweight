import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../src/report.js';

const entries = [
  { path: 'CLAUDE.md', tokens: 1800, exact: false, budget: 1500 },
  { path: '.claude/a.md', tokens: 400, exact: false, budget: 800 },
  { path: '.claude/b.md', tokens: 250, exact: true, budget: null },
];

test('statuses, totals and exceeded flag', () => {
  const r = buildReport(entries, { model: 'claude-opus-4-8' });
  assert.equal(r.files[0].status, 'over');
  assert.equal(r.files[1].status, 'ok');
  assert.equal(r.files[2].status, 'unbudgeted');
  assert.equal(r.totals.tokens, 2450);
  assert.equal(r.totals.budgeted, 2);
  assert.equal(r.totals.over, 1);
  assert.equal(r.exceeded, true);
  assert.equal(r.cost, null); // no requestsPerMonth
});

test('cost math for a known model', () => {
  const r = buildReport(entries, { model: 'claude-opus-4-8', requestsPerMonth: 10000 });
  // 2450 tokens * $5/MTok = $0.01225 per request; * 10000 = $122.50/month
  assert.ok(Math.abs(r.cost.perRequestUSD - 0.01225) < 1e-9);
  assert.ok(Math.abs(r.cost.perMonthUSD - 122.5) < 1e-6);
});

test('unknown model yields no cost even with volume; empty entries are fine', () => {
  assert.equal(buildReport(entries, { model: 'gpt-x', requestsPerMonth: 10 }).cost, null);
  const r = buildReport([], {});
  assert.equal(r.totals.tokens, 0);
  assert.equal(r.exceeded, false);
});

test('tokens exactly at budget are ok, one over is over', () => {
  const r = buildReport([
    { path: 'a', tokens: 100, exact: false, budget: 100 },
    { path: 'b', tokens: 101, exact: false, budget: 100 },
  ], {});
  assert.equal(r.files[0].status, 'ok');
  assert.equal(r.files[1].status, 'over');
});
