import type { AIAdapter } from './adapter';
import type { AIProviderConfig } from '@/shared/types';
import { OpenAIAdapter } from './openaiAdapter';
import { AnthropicAdapter } from './anthropicAdapter';
import { GeminiAdapter } from './geminiAdapter';
import { DeepSeekAdapter } from './deepseekAdapter';
import { OllamaAdapter } from './ollamaAdapter';

export function createAIAdapter(config: AIProviderConfig): AIAdapter {
  switch (config.name) {
    case 'openai': return new OpenAIAdapter(config);
    case 'anthropic': return new AnthropicAdapter(config);
    case 'gemini': return new GeminiAdapter(config);
    case 'deepseek': return new DeepSeekAdapter(config);
    case 'ollama': return new OllamaAdapter(config);
    default: throw new Error(`Unknown AI provider: ${config.name}`);
  }
}

export type { AIAdapter } from './adapter';
