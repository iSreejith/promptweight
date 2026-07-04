import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport, renderStatusline, shouldColor, fmtTokens } from '../src/render.js';
import { buildReport } from '../src/report.js';

const report = buildReport([
  { path: 'CLAUDE.md', tokens: 1800, exact: false, budget: 1500 },
  { path: '.claude/a.md', tokens: 400, exact: true, budget: 800 },
  { path: '.claude/b.md', tokens: 250, exact: false, budget: null },
], { model: 'claude-opus-4-8', requestsPerMonth: 10000 });

test('fmtTokens', () => {
  assert.equal(fmtTokens(950), '950');
  assert.equal(fmtTokens(2450), '2.5k');
});

test('report render: statuses, ~ prefix on estimates, totals, cost', () => {
  const out = renderReport(report, { color: false });
  assert.match(out, /CLAUDE\.md\s+~1800 \/ 1500/);
  assert.match(out, /OVER/);
  assert.match(out, /\.claude\/a\.md\s+400 \/ 800/);   // exact: no ~
  assert.match(out, /\.claude\/b\.md\s+~250 tokens \(no budget\)/);
  assert.match(out, /total 2\.5k tokens across 3 files/);
  assert.match(out, /\$0\.0123\/request/);
  assert.match(out, /\$122\.50\/month/);
  assert.match(out, /1 file\(s\) over budget/);
  assert.doesNotMatch(out, /\x1b\[/);
});

test('all-ok report says so', () => {
  const ok = buildReport([{ path: 'a.md', tokens: 10, exact: false, budget: 100 }], {});
  assert.match(renderReport(ok, { color: false }), /all budgets ok/);
});

test('statusline variants, never ANSI', () => {
  assert.equal(renderStatusline(report), '⚖ 2.5k tokens · 1 over budget');
  const ok = buildReport([{ path: 'a.md', tokens: 100, exact: false, budget: 200 }], {});
  assert.equal(renderStatusline(ok), '⚖ 100 tokens · all ✓');
  const unbudgeted = buildReport([{ path: 'a.md', tokens: 100, exact: false, budget: null }], {});
  assert.equal(renderStatusline(unbudgeted), '⚖ 100 tokens');
});

test('shouldColor respects NO_COLOR and TTY', () => {
  assert.equal(shouldColor({ isTTY: true }, { NO_COLOR: '1' }), false);
  assert.equal(shouldColor({ isTTY: false }, {}), false);
  assert.equal(shouldColor({ isTTY: true }, {}), true);
});
