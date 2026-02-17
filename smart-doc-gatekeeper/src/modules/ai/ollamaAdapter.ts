import type { AIAdapter } from './adapter';
import type { AIProviderConfig, UrlMetadata, ScoredUrl } from '@/shared/types';
import { SCORING_PROMPT_TEMPLATE } from '@/shared/constants';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

export class OllamaAdapter implements AIAdapter {
  name = 'Ollama';
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    // Use configured endpoint or fall back to default local URL
    this.baseUrl = (config.endpoint || DEFAULT_OLLAMA_URL).replace(/\/+$/, '');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async scoreUrls(params: { issueDescription: string; urls: UrlMetadata[] }): Promise<ScoredUrl[]> {
    const prompt = this.buildPrompt(params.issueDescription, params.urls);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content;
    if (!content) throw new Error('Empty response from Ollama');

    return this.parseResponse(content, params.urls);
  }

  private buildPrompt(issueDescription: string, urls: UrlMetadata[]): string {
    const urlsList = urls
      .map(u => `- URL: ${u.url}\n  Title: ${u.title}\n  Description: ${u.description}\n  Path: ${u.path}`)
      .join('\n');

    return SCORING_PROMPT_TEMPLATE
      .replace('{issueDescription}', issueDescription)
      .replace('{urlsList}', urlsList);
  }

  private parseResponse(content: string, originalUrls: UrlMetadata[]): ScoredUrl[] {
    try {
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : parsed.results || parsed.urls || [];

      return items
        .map((item: any) => {
          const originalUrl = originalUrls.find(u => u.url === item.url);
          return {
            url: item.url,
            title: originalUrl?.title || item.title || '',
            description: originalUrl?.description || item.description || '',
            path: originalUrl?.path || item.path || '',
            section: originalUrl?.section,
            relevance: Math.min(10, Math.max(0, Number(item.relevance) || 0)),
            category: ['tutorial', 'reference', 'concept', 'example'].includes(item.category) ? item.category : 'reference',
            reason: item.reason || 'No reason provided',
          } as ScoredUrl;
        })
        .filter((item: ScoredUrl) => item.url);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return [];
    }
  }
}
