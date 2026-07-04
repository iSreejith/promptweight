import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, countTokensExact } from '../src/tokens.js';

test('estimateTokens: empty and non-empty text', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens(null), 0);
  assert.ok(estimateTokens('hello world') >= 2);
  // ~3.7 bytes per token: 370 ascii chars ≈ 100 tokens
  const t = estimateTokens('x'.repeat(370));
  assert.ok(t >= 95 && t <= 105, String(t));
});

test('countTokensExact calls the count_tokens API', async () => {
  let captured;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return { ok: true, json: async () => ({ input_tokens: 1234 }) };
  };
  const n = await countTokensExact('some text', {
    apiKey: 'sk-test', model: 'claude-opus-4-8', fetchImpl: fakeFetch,
  });
  assert.equal(n, 1234);
  assert.match(captured.url, /count_tokens/);
  assert.equal(captured.init.headers['x-api-key'], 'sk-test');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.model, 'claude-opus-4-8');
  assert.equal(body.messages[0].content, 'some text');
});

test('countTokensExact: empty text short-circuits to 0 without fetching', async () => {
  const n = await countTokensExact('', { apiKey: 'sk-test', fetchImpl: async () => { throw new Error('should not fetch'); } });
  assert.equal(n, 0);
});

test('countTokensExact errors: missing key, HTTP failure', async () => {
  await assert.rejects(() => countTokensExact('x', {}), /ANTHROPIC_API_KEY/);
  const failFetch = async () => ({ ok: false, status: 401, text: async () => 'auth error' });
  await assert.rejects(
    () => countTokensExact('x', { apiKey: 'sk-bad', fetchImpl: failFetch }),
    /HTTP 401/,
  );
});
