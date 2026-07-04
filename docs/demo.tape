# Recording script for docs/demo.gif — see docs/vhs.Dockerfile
Output docs/demo.gif

Set FontSize 18
Set Width 1100
Set Height 620
Set Theme "Catppuccin Mocha"
Set TypingSpeed 35ms
Set Shell bash

# --- hidden setup: fake project with a bloated CLAUDE.md and budgets
Hide
Type `npx() { shift; node /vhs/bin/promptweight.js "$@"; }` Enter
Type "export SHELL=/bin/bash" Enter
Type "mkdir -p /tmp/demo/.claude/skills/pdf && cd /tmp/demo" Enter
Type `for i in $(seq 120); do printf 'Always write tests. '; done > CLAUDE.md` Enter
Type `for i in $(seq 30); do printf 'Handle PDFs carefully. '; done > .claude/skills/pdf/SKILL.md` Enter
Type `printf '{"requestsPerMonth": 10000, "budgets": [{"path": "CLAUDE.md", "maxTokens": 500}, {"path": ".claude/**/*.md", "maxTokens": 800}]}' > .promptweight.json` Enter
Type "clear" Enter
Show

Type "# Your CLAUDE.md quietly gains weight."
Sleep 600ms
Enter
Type "# Every token in it costs money on EVERY request, forever."
Sleep 800ms
Enter
Sleep 500ms

Type "npx promptweight"
Sleep 600ms
Enter
Sleep 5s

Type "# One settings line puts a live gauge in your Claude Code status bar:"
Sleep 800ms
Enter
Type "npx promptweight --statusline"
Sleep 600ms
Enter
Sleep 5s

Sleep 4s
