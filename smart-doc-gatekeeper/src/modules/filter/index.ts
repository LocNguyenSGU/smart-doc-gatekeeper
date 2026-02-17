import type { AIAdapter } from '../ai/adapter';
import type { UrlMetadata, FilterResult, ScoredUrl } from '@/shared/types';
import { preFilter } from './preFilter';
import { scoreUrlsWithAI } from './aiScorer';

export async function filterUrls(
  adapter: AIAdapter,
  urls: UrlMetadata[],
  issueDescription: string,
  maxResults: number,
  onProgress?: (scored: number, total: number) => void,
  onRealtimeResult?: (result: ScoredUrl, batchProgress: { current: number; total: number }) => void,
): Promise<FilterResult> {
  const startTime = Date.now();

  // Step 1: Pre-filter
  const { passed, filtered } = preFilter(urls);

  // Step 2: AI scoring
  const scored = await scoreUrlsWithAI(adapter, passed, issueDescription, onProgress, onRealtimeResult);

  // Step 3: Limit results
  const topResults = scored.filter(s => s.relevance > 0).slice(0, maxResults);

  return {
    issueDescription,
    totalScanned: urls.length,
    preFiltered: filtered,
    aiScored: passed.length,
    results: topResults,
    provider: adapter.name,
    duration: Date.now() - startTime,
  };
}
