import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const BIN = fileURLToPath(new URL('../bin/promptweight.js', import.meta.url));
const exec = (args, opts = {}) => run(process.execPath, [BIN, ...args], opts).catch((e) => e);

function fixture({ config } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pw-'));
  writeFileSync(join(dir, 'CLAUDE.md'), 'Be helpful. '.repeat(50)); // ~600 bytes → ~165 tokens
  mkdirSync(join(dir, '.claude', 'skills', 'demo'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'skills', 'demo', 'SKILL.md'), 'Do things.');
  if (config) writeFileSync(join(dir, '.promptweight.json'), JSON.stringify(config));
  return dir;
}

test('zero-config: reports default watch list, exits 0', async () => {
  const r = await exec([], { cwd: fixture() });
  assert.equal(r.code ?? 0, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /CLAUDE\.md/);
  assert.match(r.stdout, /SKILL\.md/);
  assert.match(r.stdout, /~\d+ tokens \(no budget\)/);
});

test('budget breach exits 1; within budget exits 0', async () => {
  const over = fixture({ config: { budgets: [{ path: 'CLAUDE.md', maxTokens: 10 }] } });
  const r1 = await exec([], { cwd: over });
  assert.equal(r1.code, 1);
  assert.match(r1.stdout, /OVER/);

  const under = fixture({ config: { budgets: [{ path: 'CLAUDE.md', maxTokens: 99999 }] } });
  const r2 = await exec([], { cwd: under });
  assert.equal(r2.code ?? 0, 0);
});

test('--json emits the report model', async () => {
  const dir = fixture({ config: { requestsPerMonth: 1000, budgets: [{ path: 'CLAUDE.md', maxTokens: 10 }] } });
  const r = await exec(['--json'], { cwd: dir });
  const report = JSON.parse(r.stdout);
  assert.equal(report.exceeded, true);
  assert.equal(report.files[0].path, 'CLAUDE.md');
  assert.ok(report.cost.perMonthUSD > 0);
});

test('--statusline is one line, no ANSI, exit 0 even when over budget', async () => {
  const dir = fixture({ config: { budgets: [{ path: 'CLAUDE.md', maxTokens: 10 }] } });
  const r = await exec(['--statusline'], { cwd: dir });
  assert.equal(r.code ?? 0, 0);
  assert.equal(r.stdout.trim().split('\n').length, 1);
  assert.match(r.stdout, /over budget/);
  assert.doesNotMatch(r.stdout, /\x1b\[/);
});

test('errors exit 2: missing budgeted file, bad config, --exact without key', async () => {
  const missing = fixture({ config: { budgets: [{ path: 'nope.md', maxTokens: 10 }] } });
  const r1 = await exec([], { cwd: missing });
  assert.equal(r1.code, 2);
  assert.match(r1.stderr, /nope\.md/);

  const bad = fixture();
  writeFileSync(join(bad, '.promptweight.json'), '{oops');
  const r2 = await exec([], { cwd: bad });
  assert.equal(r2.code, 2);

  const r3 = await exec(['--exact'], { cwd: fixture(), env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  assert.equal(r3.code, 2);
  assert.match(r3.stderr, /ANTHROPIC_API_KEY/);
});

test('--help exits 0 and mentions statusline', async () => {
  const r = await exec(['--help']);
  assert.equal(r.code ?? 0, 0);
  assert.match(r.stdout, /--statusline/);
});
