# promptweight

> Your Claude instruction files gain weight. This is the scale — and the gate.

<!-- demo GIF recorded before launch -->
![demo](docs/demo.gif)

## The problem

`CLAUDE.md` and your skills only ever grow. Every token in them is paid on
**every single request, forever** — and long instruction files make Claude
*worse* at following them, not better. The bloat arrives five lines at a
time, so nobody notices until the file is enormous.

## Quick start

```sh
npx promptweight
```

```
promptweight
  ✖ CLAUDE.md                    ~1890 / 1500 tokens OVER
  ✓ .claude/skills/pdf/SKILL.md   ~188 / 800 tokens

  total 2.1k tokens across 2 files
  ≈ $0.0104/request · $103.90/month at configured volume
  1 file(s) over budget
```

Zero config: it weighs `CLAUDE.md`, `CLAUDE.local.md`, and `.claude/**/*.md`.

## Budgets

Add `.promptweight.json` to your repo:

```json
{
  "model": "claude-opus-4-8",
  "requestsPerMonth": 10000,
  "budgets": [
    { "path": "CLAUDE.md", "maxTokens": 1500 },
    { "path": ".claude/skills/**/*.md", "maxTokens": 800 }
  ]
}
```

Glob budgets apply per matching file. `requestsPerMonth` unlocks the
$/month line. Exit codes: **0** within budget · **1** over budget · **2** error —
so promptweight *is* your CI gate.

## In your Claude Code status bar

Add to `~/.claude/settings.json` (or the project's `.claude/settings.json`):

```json
{
  "statusLine": { "type": "command", "command": "npx -y promptweight --statusline" }
}
```

You get a live fuel gauge at the bottom of every Claude Code session —
in the terminal and in VS Code's integrated terminal alike (same UI):

![statusline preview](docs/demo-statusline.gif)

*(simulated preview — recorded with the tape in `docs/statusline.tape`)*

`--statusline` always exits 0 and never prints color codes — it will never
break your status bar.

## Catch bloat the moment it happens

A Claude Code hook that re-weighs your files whenever Claude edits them:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx -y promptweight --statusline" }
        ]
      }
    ]
  }
}
```

## In CI

```yaml
name: promptweight
on: [pull_request]
jobs:
  weigh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx -y promptweight --exact
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

A PR that pushes an instruction file over budget fails the check.

## Estimates vs exact

By default counts are **estimates** (`~` prefix, bytes ÷ 3.7) — instant,
offline, no API key, right for statuslines and hooks. `--exact` asks
Anthropic's official [count_tokens](https://platform.claude.com/docs/en/build-with-claude/token-counting)
endpoint (free to call) for precise numbers — right for CI gates. Exact
counts display without the `~`.

## FAQ

**Why not just watch file size?**
Cost and context are per *token*, not per byte, and the relationship varies
with content. Budgets in tokens are budgets in dollars.

**Does it send my files anywhere?**
In default mode: never — everything is local. With `--exact`, file contents
go to Anthropic's token-counting endpoint only (the same place they go every
time Claude reads them).

**What about OpenAI / other providers?**
v0.1 is Claude-focused (that's where CLAUDE.md and skills live). The
estimator works for any text; exact mode is Anthropic-only.

## Contributing

Issues and PRs welcome. Zero dependencies, ~300 lines — `npm test` runs
everything.

## License

[MIT](LICENSE)
