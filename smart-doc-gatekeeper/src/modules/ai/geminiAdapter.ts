import type { AIAdapter } from './adapter';
import type { AIProviderConfig, UrlMetadata, ScoredUrl } from '@/shared/types';
import { SCORING_PROMPT_TEMPLATE } from '@/shared/constants';

export class GeminiAdapter implements AIAdapter {
  name = 'Gemini';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async scoreUrls(params: { issueDescription: string; urls: UrlMetadata[] }): Promise<ScoredUrl[]> {
    const prompt = this.buildPrompt(params.issueDescription, params.urls);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty response from Gemini');

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
