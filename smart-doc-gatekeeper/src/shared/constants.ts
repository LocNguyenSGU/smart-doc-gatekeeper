import type { AIProviderName, ExtensionSettings } from './types';

export interface ModelInfo {
  id: string;
  label: string;
  description: string;
  tier: 'flagship' | 'balanced' | 'fast';
}

export const PROVIDER_MODELS: Record<AIProviderName, ModelInfo[]> = {
  openai: [
    { id: 'gpt-5', label: 'GPT-5', description: 'Flagship — logic & data mạnh nhất', tier: 'flagship' },
    { id: 'gpt-5.2', label: 'GPT-5.2', description: 'Phiên bản cải tiến của GPT-5', tier: 'flagship' },
    { id: 'o3', label: 'o3', description: 'Suy luận sâu, độ tin cậy cao', tier: 'flagship' },
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Đa phương thức, cân bằng', tier: 'balanced' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini', description: 'Nhanh, tiết kiệm chi phí', tier: 'fast' },
    { id: 'o1', label: 'o1', description: 'Suy luận chuỗi tư duy', tier: 'balanced' },
  ],
  anthropic: [
    { id: 'claude-opus-4.6', label: 'Claude Opus 4.6', description: 'Thông minh nhất — suy luận phức tạp', tier: 'flagship' },
    { id: 'claude-4.5-sonnet', label: 'Claude 4.5 Sonnet', description: 'Tốt nhất tổng thể, giá hợp lý', tier: 'balanced' },
    { id: 'claude-3-opus', label: 'Claude 3 Opus', description: 'Thế hệ trước, vẫn mạnh', tier: 'balanced' },
    { id: 'claude-3-sonnet', label: 'Claude 3 Sonnet', description: 'Cân bằng tốc độ & chất lượng', tier: 'fast' },
  ],
  gemini: [
    { id: 'gemini-3-pro', label: 'Gemini 3 Pro', description: 'Preview — suy luận & đa phương thức mạnh nhất', tier: 'flagship' },
    { id: 'gemini-3-flash', label: 'Gemini 3 Flash', description: 'Preview — cân bằng tốc độ & quy mô', tier: 'balanced' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Tư duy nâng cao cho code & toán', tier: 'flagship' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Hiệu suất/giá tốt, context lớn', tier: 'balanced' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', description: 'Siêu nhanh, tiết kiệm chi phí', tier: 'fast' },
  ],
  deepseek: [
    { id: 'deepseek-v3.2', label: 'DeepSeek V3.2', description: 'Flagship — cạnh tranh GPT-5 & Gemini 3', tier: 'flagship' },
    { id: 'deepseek-v3', label: 'DeepSeek V3', description: 'MoE, hiệu năng cao', tier: 'flagship' },
    { id: 'deepseek-chat', label: 'DeepSeek Chat', description: 'Đa dụng, chi phí thấp', tier: 'balanced' },
    { id: 'deepseek-coder', label: 'DeepSeek Coder', description: 'Chuyên lập trình (33B)', tier: 'balanced' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', description: 'Suy luận chuyên sâu', tier: 'flagship' },
  ],
  ollama: [
    { id: 'llama3.2', label: 'Llama 3.2', description: 'Meta — đa dụng, phổ biến', tier: 'balanced' },
    { id: 'mistral', label: 'Mistral', description: 'Nhanh, hiệu quả', tier: 'fast' },
    { id: 'qwen2.5', label: 'Qwen 2.5', description: 'Alibaba — đa ngôn ngữ', tier: 'balanced' },
    { id: 'deepseek-coder:33b', label: 'DeepSeek Coder 33B', description: 'Chuyên code, chạy local', tier: 'flagship' },
    { id: 'gemma2', label: 'Gemma 2', description: 'Google — nhẹ, nhanh', tier: 'fast' },
  ],
};

export const PROVIDER_DESCRIPTIONS: Record<AIProviderName, string> = {
  openai: 'GPT-5 series & o-series reasoning models',
  anthropic: 'Claude 4.x — Opus, Sonnet tập trung suy luận',
  gemini: 'Google AI — đa phương thức, context window lớn',
  deepseek: 'Open-source MoE, mạnh coding & reasoning',
  ollama: 'Chạy local — offline, bảo mật, miễn phí',
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
    name: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
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
