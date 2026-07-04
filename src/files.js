import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const IGNORED_DIRS = ['node_modules', '.git'];

export function globToRegExp(glob) {
  const g = glob.replace(/\\/g, '/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        if (g[i + 2] === '/') { re += '(?:.*/)?'; i += 2; }
        else { re += '.*'; i += 1; }
      } else {
        re += '[^/]*';
      }
    } else if ('.+?^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

export function walk(dir) {
  const out = [];
  const rec = (abs, prefix) => {
    let entries;
    try { entries = readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORED_DIRS.includes(e.name)) continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) rec(join(abs, e.name), rel);
      else if (e.isFile()) out.push(rel);
    }
  };
  rec(dir, '');
  return out;
}

export function resolvePatterns(patterns, { cwd = process.cwd(), files } = {}) {
  let all = files;
  const result = [];
  for (const pattern of patterns) {
    const p = pattern.replace(/\\/g, '/');
    if (!p.includes('*')) {
      result.push({ pattern, path: p, literal: true });
      continue;
    }
    if (!all) all = walk(cwd); // lazy: only walk when a glob is present
    const re = globToRegExp(p);
    for (const f of all) {
      if (re.test(f)) result.push({ pattern, path: f, literal: false });
    }
  }
  return result;
}
