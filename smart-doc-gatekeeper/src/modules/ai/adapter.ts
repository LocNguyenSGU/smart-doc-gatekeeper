import type { UrlMetadata, ScoredUrl, AIProviderConfig } from '@/shared/types';

export interface AIAdapter {
  name: string;
  testConnection(): Promise<boolean>;
  scoreUrls(params: {
    issueDescription: string;
    urls: UrlMetadata[];
  }): Promise<ScoredUrl[]>;
}

// Re-export for convenience
export type { AIProviderConfig };
