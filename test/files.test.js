import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { globToRegExp, walk, resolvePatterns } from '../src/files.js';

test('globToRegExp: * does not cross directories, ** does', () => {
  assert.ok(globToRegExp('*.md').test('CLAUDE.md'));
  assert.ok(!globToRegExp('*.md').test('docs/CLAUDE.md'));
  assert.ok(globToRegExp('.claude/**/*.md').test('.claude/skills/pdf/SKILL.md'));
  assert.ok(globToRegExp('.claude/**/*.md').test('.claude/notes.md'));
  assert.ok(!globToRegExp('.claude/**/*.md').test('other/notes.md'));
  // regex metacharacters in filenames are escaped
  assert.ok(globToRegExp('a+b.md').test('a+b.md'));
  assert.ok(!globToRegExp('a+b.md').test('aab.md'));
});

test('walk lists files recursively, skipping node_modules and .git', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-'));
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  mkdirSync(join(dir, 'node_modules', 'x'), { recursive: true });
  writeFileSync(join(dir, 'CLAUDE.md'), 'a');
  writeFileSync(join(dir, '.claude', 'skills', 'SKILL.md'), 'b');
  writeFileSync(join(dir, 'node_modules', 'x', 'ignore.md'), 'c');
  const files = walk(dir).sort();
  assert.deepEqual(files, ['.claude/skills/SKILL.md', 'CLAUDE.md']);
});

test('resolvePatterns: literals pass through, globs expand via file list', () => {
  const files = ['CLAUDE.md', '.claude/a.md', '.claude/deep/b.md', 'src/x.js'];
  const out = resolvePatterns(['CLAUDE.md', '.claude/**/*.md'], { files });
  assert.deepEqual(out, [
    { pattern: 'CLAUDE.md', path: 'CLAUDE.md', literal: true },
    { pattern: '.claude/**/*.md', path: '.claude/a.md', literal: false },
    { pattern: '.claude/**/*.md', path: '.claude/deep/b.md', literal: false },
  ]);
});
