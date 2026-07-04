// ~3.7 bytes per token is a reasonable heuristic for English/markdown on
// current Claude tokenizers; estimates are labeled with "~" in all output.
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(Buffer.byteLength(text, 'utf8') / 3.7);
}

export async function countTokensExact(text, {
  apiKey,
  model = 'claude-opus-4-8',
  fetchImpl = fetch,
} = {}) {
  if (!text) return 0;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required for --exact mode (get one at console.anthropic.com)');
  }
  const res = await fetchImpl('https://api.anthropic.com/v1/messages/count_tokens', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: text }] }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`count_tokens failed (HTTP ${res.status}): ${detail}`);
  }
  const data = await res.json();
  return data.input_tokens;
}
