#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { loadConfig, DEFAULT_WATCH } from '../src/config.js';
import { resolvePatterns } from '../src/files.js';
import { estimateTokens, countTokensExact } from '../src/tokens.js';
import { buildReport } from '../src/report.js';
import { renderReport, renderStatusline, shouldColor } from '../src/render.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const HELP = `promptweight — token budgets for your Claude instruction files.

Usage:
  promptweight                 weigh watched files, print report
  promptweight --statusline    one-line summary for the Claude Code status bar
  promptweight --json          machine-readable report
  promptweight --exact         count via Anthropic API (needs ANTHROPIC_API_KEY)
  promptweight --config <file> config path (default: .promptweight.json)

Exit codes: 0 within budget · 1 over budget · 2 error
Config: .promptweight.json — see https://github.com/iSreejith/promptweight`;

function fail(msg) {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: false,
      options: {
        json: { type: 'boolean', default: false },
        statusline: { type: 'boolean', default: false },
        exact: { type: 'boolean', default: false },
        config: { type: 'string', default: '.promptweight.json' },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    });
  } catch (e) {
    fail(e.message);
  }
  const { values } = parsed;
  if (values.help) { console.log(HELP); return; }
  if (values.version) { console.log(pkg.version); return; }

  let config;
  try { config = loadConfig(values.config); } catch (e) { fail(e.message); }
  const hasBudgets = config.budgets !== null;
  const watch = hasBudgets
    ? config.budgets
    : DEFAULT_WATCH.map((path) => ({ path, maxTokens: null }));

  const entries = [];
  for (const item of watch) {
    for (const r of resolvePatterns([item.path])) {
      if (r.literal && !existsSync(r.path)) {
        if (hasBudgets) fail(`budgeted file not found: ${r.path}`);
        continue; // default watch list: missing files are simply absent
      }
      let text;
      try { text = readFileSync(r.path, 'utf8'); } catch (e) { fail(`cannot read ${r.path}: ${e.message}`); }
      let tokens;
      let exact = false;
      if (values.exact) {
        try {
          tokens = await countTokensExact(text, {
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: config.model,
          });
          exact = true;
        } catch (e) { fail(e.message); }
      } else {
        tokens = estimateTokens(text);
      }
      entries.push({ path: r.path, tokens, exact, budget: item.maxTokens });
    }
  }

  const report = buildReport(entries, config);
  if (values.statusline) {
    console.log(renderStatusline(report));
    return; // statusline must never fail the host: always exit 0
  }
  if (values.json) console.log(JSON.stringify(report, null, 2));
  else console.log(renderReport(report, { color: shouldColor() }));
  process.exit(report.exceeded ? 1 : 0);
}

main().catch((e) => fail(e.stack ?? String(e)));
