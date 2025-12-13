// LLM service wrapper (OpenAI by default)
import OpenAI from 'openai';

const provider = process.env.LLM_PROVIDER || 'openai';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let client = null;
if (provider === 'openai') {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[LLM] Missing OPENAI_API_KEY. AI endpoints will fail until set.');
    client = null; // defer init until key provided
  } else {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
}

function ensure() {
  // Re-init if env became available at runtime (e.g., hot reload)
  if (!client && provider === 'openai' && process.env.OPENAI_API_KEY) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (!client) {
    const err = new Error('LLM client not configured. Set OPENAI_API_KEY.');
    err.statusCode = 503; // Service Unavailable
    throw err;
  }
}

// Helper: Sleep for ms
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// messages: [{ role: 'system'|'user'|'assistant', content: string }]
export async function chat(messages, opts = {}) {
  ensure();
  const model = opts.model || DEFAULT_MODEL;
  const maxRetries = opts.maxRetries || 2; // Retry up to 2 times for rate limits
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 500,
      });
      const text = res?.choices?.[0]?.message?.content?.trim() || '';
      return { text, raw: res };
    } catch (e) {
      // If rate limit (429) and still have retries, wait and retry
      if (e?.status === 429 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s exponential backoff
        console.log(`[LLM] Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue; // Retry
      }
      
      // Otherwise, throw error
      const err = new Error(e?.message || 'LLM chat error');
      err.statusCode = e?.status || 500;
      throw err;
    }
  }
}

// Ask for strict JSON response
export async function structuredJSON(prompt, schemaHint, opts = {}) {
  const sys = 'You are a JSON-only assistant. Always reply with valid JSON only.';
  const messages = [
    { role: 'system', content: sys },
    { role: 'user', content: `${prompt}\n\nReturn JSON with this shape: ${schemaHint}` },
  ];
  const { text } = await chat(messages, { ...opts, temperature: 0.25, max_tokens: 800 });
  try {
    const cleaned = text.replace(/^```json\n?|```$/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { _raw: text, error: 'JSON_PARSE_ERROR' };
  }
}

export default { chat, structuredJSON };
