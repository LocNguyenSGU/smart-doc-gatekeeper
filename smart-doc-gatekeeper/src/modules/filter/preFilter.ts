import type { UrlMetadata } from '@/shared/types';
import { FILTER_CONFIG } from '@/shared/constants';

/**
 * Pre-filter URLs using rule-based patterns.
 * Returns { passed: UrlMetadata[], filtered: number }
 */
export function preFilter(urls: UrlMetadata[]): { passed: UrlMetadata[]; filtered: number } {
  const passed: UrlMetadata[] = [];
  let filtered = 0;

  for (const url of urls) {
    const fullText = `${url.url} ${url.title} ${url.path}`.toLowerCase();
    const isExcluded = FILTER_CONFIG.EXCLUDE_PATTERNS.some(pattern => pattern.test(fullText));
    
    if (isExcluded) {
      filtered++;
    } else {
      passed.push(url);
    }
  }

  return { passed, filtered };
}
