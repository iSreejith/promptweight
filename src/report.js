import { INPUT_PRICE_PER_MTOK } from './config.js';

export function buildReport(entries, { model = 'claude-opus-4-8', requestsPerMonth = null } = {}) {
  const files = entries.map((e) => ({
    path: e.path,
    tokens: e.tokens,
    exact: Boolean(e.exact),
    budget: e.budget ?? null,
    status: e.budget == null ? 'unbudgeted' : (e.tokens > e.budget ? 'over' : 'ok'),
  }));
  const tokens = files.reduce((sum, f) => sum + f.tokens, 0);
  const totals = {
    tokens,
    budgeted: files.filter((f) => f.status !== 'unbudgeted').length,
    over: files.filter((f) => f.status === 'over').length,
  };
  const price = INPUT_PRICE_PER_MTOK[model];
  let cost = null;
  if (price !== undefined && requestsPerMonth) {
    const perRequestUSD = (tokens * price) / 1e6;
    cost = { perRequestUSD, perMonthUSD: perRequestUSD * requestsPerMonth };
  }
  return { files, totals, cost, exceeded: totals.over > 0 };
}
