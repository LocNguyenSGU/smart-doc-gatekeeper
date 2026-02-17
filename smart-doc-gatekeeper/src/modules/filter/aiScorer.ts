import type { AIAdapter } from '../ai/adapter';
import type { UrlMetadata, ScoredUrl } from '@/shared/types';
import { FILTER_CONFIG } from '@/shared/constants';

/**
 * Score URLs using AI in batches.
 * Returns scored URLs sorted by relevance (descending).
 */
export async function scoreUrlsWithAI(
  adapter: AIAdapter,
  urls: UrlMetadata[],
  issueDescription: string,
  onProgress?: (scored: number, total: number) => void,
  onRealtimeResult?: (result: ScoredUrl, batchProgress: { current: number; total: number }) => void,
): Promise<ScoredUrl[]> {
  const allScored: ScoredUrl[] = [];
  const batchSize = FILTER_CONFIG.BATCH_SIZE;
  const totalBatches = Math.ceil(urls.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const batch = urls.slice(i * batchSize, (i + 1) * batchSize);
    
    let retries = 0;
    let scored: ScoredUrl[] = [];
    
    while (retries < FILTER_CONFIG.MAX_RETRIES) {
      try {
        scored = await adapter.scoreUrls({
          issueDescription,
          urls: batch,
        });
        break;
      } catch (error) {
        retries++;
        if (retries >= FILTER_CONFIG.MAX_RETRIES) {
          console.error(`Failed to score batch ${i + 1} after ${FILTER_CONFIG.MAX_RETRIES} retries:`, error);
          // Assign default low scores to failed batch
          scored = batch.map(u => ({
            ...u,
            relevance: 0,
            category: 'reference' as const,
            reason: 'Failed to score - AI error',
          }));
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    // Send individual results as they come in
    if (onRealtimeResult) {
      for (const result of scored) {
        onRealtimeResult(result, { current: allScored.length + 1, total: urls.length });
        allScored.push(result);
      }
    } else {
      allScored.push(...scored);
    }
    
    onProgress?.(allScored.length, urls.length);
  }

  // Sort by relevance descending
  return allScored.sort((a, b) => b.relevance - a.relevance);
}
