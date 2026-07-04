export function shouldColor(stream = process.stdout, env = process.env) {
  return Boolean(stream.isTTY) && !env.NO_COLOR;
}

function palette(enabled) {
  const wrap = (code) => (s) => (enabled ? `\x1b[${code}m${s}\x1b[0m` : String(s));
  return { red: wrap('31'), green: wrap('32'), bold: wrap('1'), dim: wrap('2') };
}

export function fmtTokens(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function renderReport(report, { color = false } = {}) {
  const c = palette(color);
  const lines = [c.bold('promptweight')];
  const width = Math.max(10, ...report.files.map((f) => f.path.length));
  for (const f of report.files) {
    const count = `${f.exact ? '' : '~'}${f.tokens}`;
    const name = f.path.padEnd(width);
    if (f.status === 'over') {
      lines.push(`  ${c.red('✖')} ${name}  ${c.red(count)} / ${f.budget} tokens ${c.red('OVER')}`);
    } else if (f.status === 'ok') {
      lines.push(`  ${c.green('✓')} ${name}  ${count} / ${f.budget} tokens`);
    } else {
      lines.push(`  ${c.dim('·')} ${name}  ${count} tokens ${c.dim('(no budget)')}`);
    }
  }
  lines.push('');
  lines.push(`  total ${fmtTokens(report.totals.tokens)} tokens across ${report.files.length} files`);
  if (report.cost) {
    lines.push(`  ≈ $${report.cost.perRequestUSD.toFixed(4)}/request · $${report.cost.perMonthUSD.toFixed(2)}/month at configured volume`);
  }
  lines.push(
    report.exceeded
      ? c.red(`  ${report.totals.over} file(s) over budget`)
      : c.green('  all budgets ok'),
  );
  return lines.join('\n');
}

export function renderStatusline(report) {
  const total = `⚖ ${fmtTokens(report.totals.tokens)} tokens`;
  if (report.totals.budgeted === 0) return total;
  return report.exceeded
    ? `${total} · ${report.totals.over} over budget`
    : `${total} · all ✓`;
}
