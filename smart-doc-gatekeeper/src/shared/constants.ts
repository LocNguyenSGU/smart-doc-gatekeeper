import type { AIProviderName, ExtensionSettings } from './types';

export const PROVIDER_MODELS: Record<AIProviderName, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o'],
  anthropic: ['claude-3-haiku-20241022', 'claude-3-5-sonnet-20241022'],
  gemini: ['gemini-2.0-flash', 'gemini-2.0-pro'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  ollama: ['llama3.2', 'mistral', 'qwen2.5'],
};

export const PROVIDER_ENDPOINTS: Record<AIProviderName, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  deepseek: 'https://api.deepseek.com/v1',
  ollama: 'http://localhost:11434',
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: {
    name: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  maxUrls: 200,
  maxResults: 15,
};

export const CRAWL_CONFIG = {
  MAX_URLS: 200,
  MAX_DEPTH: 2,
  MAX_CONCURRENT: 5,
  REQUEST_DELAY_MS: 200,
  TIMEOUT_MS: 10000,
};

export const FILTER_CONFIG = {
  BATCH_SIZE: 20,
  MAX_RETRIES: 3,
  // URL patterns to exclude
  EXCLUDE_PATTERNS: [
    /privacy/i,
    /terms/i,
    /contact/i,
    /login/i,
    /sign-?up/i,
    /sign-?in/i,
    /404/i,
    /changelog/i,
    /release-notes/i,
    /contributing/i,
    /license/i,
    /cookie/i,
    /legal/i,
    /careers/i,
    /blog(?!\/)/i, // blog index but not blog posts about docs
    /pricing/i,
    /support\/ticket/i,
  ],
  // Asset extensions to skip
  ASSET_EXTENSIONS: ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip'],
};

export const SCORING_PROMPT_TEMPLATE = `You are an expert technical documentation analyst.

USER'S PROBLEM: {issueDescription}

Evaluate the following documentation URLs. For each URL, provide:
- relevance (0-10): how relevant to the user's problem
- category: "tutorial" | "reference" | "concept" | "example"
- reason: brief explanation (1 sentence)

Return a JSON array only, no other text. Example:
[{"url": "...", "relevance": 8, "category": "tutorial", "reason": "..."}]

URLs to evaluate:
{urlsList}`;
