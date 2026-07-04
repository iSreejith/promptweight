import { readFileSync, existsSync } from 'node:fs';

export const DEFAULT_WATCH = ['CLAUDE.md', 'CLAUDE.local.md', '.claude/**/*.md'];

// USD per million input tokens, as of 2026-07. Unknown model => no cost line.
export const INPUT_PRICE_PER_MTOK = {
  'claude-opus-4-8': 5,
  'claude-opus-4-7': 5,
  'claude-opus-4-6': 5,
  'claude-sonnet-5': 3,
  'claude-sonnet-4-6': 3,
  'claude-haiku-4-5': 1,
};

export function normalizeConfig(raw, source = 'config') {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${source}: config must be an object`);
  }
  const model = raw.model ?? 'claude-opus-4-8';
  const requestsPerMonth = raw.requestsPerMonth ?? null;
  if (requestsPerMonth !== null && (!Number.isFinite(requestsPerMonth) || requestsPerMonth <= 0)) {
    throw new Error(`${source}: requestsPerMonth must be a positive number`);
  }
  let budgets = null;
  if (raw.budgets !== undefined) {
    if (!Array.isArray(raw.budgets)) throw new Error(`${source}: budgets must be an array`);
    budgets = raw.budgets.map((b, i) => {
      if (!b || typeof b.path !== 'string') {
        throw new Error(`${source}: budgets[${i}].path must be a string`);
      }
      if (b.maxTokens !== undefined && (!Number.isInteger(b.maxTokens) || b.maxTokens <= 0)) {
        throw new Error(`${source}: budgets[${i}].maxTokens must be a positive integer`);
      }
      return { path: b.path, maxTokens: b.maxTokens ?? null };
    });
  }
  return { model, requestsPerMonth, budgets };
}

export function loadConfig(path) {
  if (!existsSync(path)) return normalizeConfig({});
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`cannot parse ${path}: ${e.message}`);
  }
  return normalizeConfig(raw, path);
}
