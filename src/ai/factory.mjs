import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const clientCache = new Map();

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
// Cap retry-after to avoid pathological wait times when servers return huge values.
const MAX_RETRY_DELAY_MS = 30_000;
const ANTHROPIC_MAX_TOKENS_DEFAULT = 4096;
const ANTHROPIC_MAX_TOKENS_BY_MODEL = {
  'claude-opus-4-7': 8192,
  'claude-sonnet-4-6': 8192,
  'claude-haiku-4-5': 4096,
};

function isRetriableError(err) {
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  if (err?.name === 'AbortError') return true;
  if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNRESET' || err?.code === 'ENOTFOUND')
    return true;
  return false;
}

function parseRetryAfter(value) {
  if (value === undefined || value === null || value === '') return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    // Numeric inputs are seconds-since-now. Negative values are nonsensical
    // for retry-after, so reject them rather than falling through to
    // Date.parse (which interprets bare "-3" as year -3).
    return seconds >= 0 ? Math.floor(seconds * 1000) : null;
  }
  const httpDate = Date.parse(value);
  if (!Number.isNaN(httpDate)) return Math.max(0, httpDate - Date.now());
  return null;
}

function getBackoffMs(err, attempt) {
  // Provider SDKs (OpenAI / Anthropic) expose response headers via err.headers
  // or err.response.headers; check both shapes. Anthropic also publishes
  // rate-limit reset hints under `anthropic-ratelimit-*-reset` (HTTP-date).
  const headers = err?.headers ?? err?.response?.headers ?? {};
  const retryAfter =
    parseRetryAfter(headers['retry-after']) ??
    parseRetryAfter(headers['anthropic-ratelimit-requests-reset']) ??
    parseRetryAfter(headers['anthropic-ratelimit-tokens-reset']);
  if (retryAfter !== null) {
    return Math.min(retryAfter, MAX_RETRY_DELAY_MS);
  }
  return RETRY_DELAY_MS * attempt;
}

async function withRetry(fn) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const retriable = isRetriableError(err);
      if (!retriable || attempt > MAX_RETRIES) {
        if (process.env.RIVER_AI_RETRY_DEBUG === '1') {
          // eslint-disable-next-line no-console
          console.error(`[AI retry] giving up after ${attempt} attempts:`, err?.message || err);
        }
        throw err;
      }
      const delay = getBackoffMs(err, attempt);
      if (process.env.RIVER_AI_RETRY_DEBUG === '1') {
        // eslint-disable-next-line no-console
        console.warn(
          `[AI retry] attempt ${attempt} failed (${err?.message || err}); retrying in ${delay}ms...`,
        );
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

function resolveAnthropicMaxTokens(modelName, explicit) {
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  return ANTHROPIC_MAX_TOKENS_BY_MODEL[modelName] ?? ANTHROPIC_MAX_TOKENS_DEFAULT;
}

// Test-only: clear the cached client map so unit tests can re-construct
// clients with different env vars without colliding on cacheKey.
function __clearAIClientCacheForTests() {
  clientCache.clear();
}

// --- テスト用 named export (内部ヘルパー) ---
export {
  isRetriableError,
  withRetry,
  parseRetryAfter,
  getBackoffMs,
  resolveAnthropicMaxTokens,
  isAnthropicPromptCacheEnabled,
  buildAnthropicSystem,
  normalizeAnthropicUsage,
  normalizeOpenAIUsage,
  normalizeGeminiUsage,
  assertAnthropicModelName,
  __clearAIClientCacheForTests,
};

export class AIClientFactory {
  static create({ modelName, temperature, maxTokens, disableCache }) {
    if (!modelName) {
      throw new Error('モデル名が指定されていません (config.skills[].model を確認してください)');
    }
    // maxTokens and disableCache are part of the cache key so two skills
    // targeting the same model with different settings do not stomp on
    // each other in the module-level clientCache.
    const cacheKey = `${modelName}::${temperature ?? 'default'}::${maxTokens ?? 'default'}::${disableCache ? 'nocache' : 'cache'}`;
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey);
    }

    let client = null;
    if (modelName.startsWith('gemini')) {
      const apiKey = process.env.GOOGLE_API_KEY;
      client = new GeminiClient(modelName, apiKey, temperature);
    } else if (modelName.match(/^(gpt|o1)/)) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.RIVER_OPENAI_API_KEY;
      client = new OpenAIClient(modelName, apiKey, temperature);
    } else if (modelName.startsWith('claude')) {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.RIVER_ANTHROPIC_API_KEY;
      client = new AnthropicClient(modelName, apiKey, temperature, maxTokens, {
        disableCache: Boolean(disableCache),
      });
    }

    if (!client) throw new Error(`Unsupported model: ${modelName}`);
    clientCache.set(cacheKey, client);
    return client;
  }
}

// Normalize Google Gemini `usageMetadata` into the same camelCase shape as
// the other providers. Gemini reports `cachedContentTokenCount` for context
// caching hits; we map it to `cacheReadInputTokens`. Gemini does not bill
// separately for cache creation, so `cacheCreationInputTokens` stays 0.
function normalizeGeminiUsage(raw, modelName) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    provider: 'google',
    model: modelName,
    inputTokens: raw.promptTokenCount ?? 0,
    outputTokens: raw.candidatesTokenCount ?? 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: raw.cachedContentTokenCount ?? 0,
  };
}

class GeminiClient {
  constructor(modelName, apiKey, temperature) {
    this.modelName = modelName;
    this.temperature = temperature ?? 0.2;
    this.lastUsage = null;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY が設定されていません');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateReview(systemPrompt, diff) {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const result = await withRetry(() =>
      model.generateContent({
        generationConfig: {
          temperature: this.temperature,
        },
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'user', parts: [{ text: `Here is the code diff to review:\n\n${diff}` }] },
        ],
      })
    );

    this.lastUsage = normalizeGeminiUsage(result?.response?.usageMetadata, this.modelName);

    return result.response.text();
  }
}

// Normalize the OpenAI Chat Completions usage block. Recent SDK versions
// also expose cached prompt tokens via `prompt_tokens_details.cached_tokens`;
// we surface that as `cacheReadInputTokens` so the shape matches Anthropic.
function normalizeOpenAIUsage(raw, modelName) {
  if (!raw || typeof raw !== 'object') return null;
  const cachedTokens = raw.prompt_tokens_details?.cached_tokens ?? 0;
  return {
    provider: 'openai',
    model: modelName,
    inputTokens: raw.prompt_tokens ?? 0,
    outputTokens: raw.completion_tokens ?? 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: cachedTokens,
  };
}

class OpenAIClient {
  constructor(modelName, apiKey, temperature) {
    this.modelName = modelName;
    this.temperature = temperature ?? 0;
    this.lastUsage = null;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY (または RIVER_OPENAI_API_KEY) が設定されていません');
    }
    this.openai = new OpenAI({ apiKey, timeout: 15000 });
  }

  async generateReview(systemPrompt, diff) {
    const isReasoning = this.modelName.startsWith('o1');

    const messages = isReasoning
      ? [
          {
            role: 'user',
            content: `${systemPrompt}\n\n---\n\nDiff:\n${diff}`,
          },
        ]
      : [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: diff },
        ];

    const response = await withRetry(() =>
      this.openai.chat.completions.create({
        model: this.modelName,
        messages,
        temperature: this.temperature,
      })
    );

    this.lastUsage = normalizeOpenAIUsage(response?.usage, this.modelName);

    return response.choices[0].message.content || '';
  }
}

// Prompt caching opt-out: set RIVER_ANTHROPIC_PROMPT_CACHE=0 to send the
// system prompt as a plain string (no cache_control). Default is enabled
// because review pipelines repeatedly send the same skill systemPrompt
// across many files, where the 5-minute ephemeral cache delivers a large
// cost reduction with no behavioral change.
function isAnthropicPromptCacheEnabled() {
  return process.env.RIVER_ANTHROPIC_PROMPT_CACHE !== '0';
}

// Defense-in-depth allow-list for Anthropic model names (independent of the
// upstream config schema gate). The factory's prefix check (`startsWith('claude')`)
// is intentionally lenient for forward compatibility, but the SDK-facing
// client should still reject obviously-malformed names — both to fail fast
// on typos and to limit the blast radius if upstream validation is ever
// bypassed (e.g. programmatic API callers, future plugin entry points).
//
// Pattern intent: `claude-<family>-<version-or-snapshot>`. Update when
// Anthropic adds a new model family beyond sonnet/opus/haiku.
const ANTHROPIC_MODEL_PATTERN = /^claude-(sonnet|opus|haiku)-[a-z0-9.\-_]+$/i;

function assertAnthropicModelName(modelName) {
  if (!ANTHROPIC_MODEL_PATTERN.test(modelName)) {
    throw new Error(
      `Invalid Anthropic model name: ${modelName} ` +
        `(expected claude-{sonnet|opus|haiku}-<version>)`,
    );
  }
}

// Normalize the raw `response.usage` block returned by the Anthropic SDK
// into a stable shape that cost-estimation tooling (and #803 benchmark
// guides) can consume without depending on SDK internals.
function normalizeAnthropicUsage(raw, modelName) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    provider: 'anthropic',
    model: modelName,
    inputTokens: raw.input_tokens ?? 0,
    outputTokens: raw.output_tokens ?? 0,
    cacheCreationInputTokens: raw.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: raw.cache_read_input_tokens ?? 0,
  };
}

function buildAnthropicSystem(systemPrompt, { cacheEnabled }) {
  if (!cacheEnabled) return systemPrompt;
  // Array form is required to attach cache_control. Anthropic ignores the
  // hint when the block falls below the model's minimum cacheable length
  // (1024 tokens for sonnet/opus, 2048 for haiku) — safe to set unconditionally.
  return [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

class AnthropicClient {
  constructor(modelName, apiKey, temperature, maxTokens, options = {}) {
    assertAnthropicModelName(modelName);
    this.modelName = modelName;
    this.temperature = temperature ?? 0;
    this.maxTokens = resolveAnthropicMaxTokens(modelName, maxTokens);
    this.disableCache = Boolean(options.disableCache);
    // Normalized usage from the most recent generateReview call. Callers
    // (e.g. skill-dispatcher) read this after `await client.generateReview`
    // to attribute token counts and cache effectiveness to a specific
    // (skill, file) pair. Stays null until the first successful call.
    this.lastUsage = null;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY (または RIVER_ANTHROPIC_API_KEY) が設定されていません');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateReview(systemPrompt, diff) {
    const cacheEnabled = isAnthropicPromptCacheEnabled() && !this.disableCache;
    const response = await withRetry(() =>
      this.anthropic.messages.create({
        model: this.modelName,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: buildAnthropicSystem(systemPrompt, { cacheEnabled }),
        messages: [{ role: 'user', content: diff }],
      })
    );

    this.lastUsage = normalizeAnthropicUsage(response?.usage, this.modelName);

    if (process.env.RIVER_AI_RETRY_DEBUG === '1' && this.lastUsage) {
      const u = this.lastUsage;
      // eslint-disable-next-line no-console
      console.log(
        `[Anthropic usage] input=${u.inputTokens} output=${u.outputTokens} ` +
          `cache_create=${u.cacheCreationInputTokens} cache_read=${u.cacheReadInputTokens}`,
      );
    }

    // Concatenate every text block. Extended-thinking and tool-use responses
    // can interleave non-text blocks, so we filter+join rather than picking
    // only the first text element.
    const textBlocks = (response.content ?? []).filter((block) => block?.type === 'text');
    return textBlocks.map((block) => block.text ?? '').join('\n');
  }
}
