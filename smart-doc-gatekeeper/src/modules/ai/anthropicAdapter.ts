import type { AIAdapter } from './adapter';
import type { AIProviderConfig, UrlMetadata, ScoredUrl } from '@/shared/types';
import { SCORING_PROMPT_TEMPLATE } from '@/shared/constants';

export class AnthropicAdapter implements AIAdapter {
  name = 'Anthropic';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 64,
          messages: [{ role: 'user', content: 'Reply with "ok"' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async scoreUrls(params: { issueDescription: string; urls: UrlMetadata[] }): Promise<ScoredUrl[]> {
    const prompt = this.buildPrompt(params.issueDescription, params.urls);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text;
    if (!rawContent) throw new Error('Empty response from Anthropic');

    const content = this.extractJson(rawContent);
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

  private extractJson(text: string): string {
    // If the response contains a ```json code block, extract the content inside
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // If the response contains a generic ``` code block, try that
    const codeBlockMatch = text.match(/```\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Otherwise return the raw text (it might already be valid JSON)
    return text.trim();
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
