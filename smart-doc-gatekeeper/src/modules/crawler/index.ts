import type { CrawlResult } from '@/shared/types';
import { crawlSitemap } from './sitemapCrawler';
import { crawlDom } from './domCrawler';

export async function crawl(
  baseUrl: string,
  onProgress?: (found: number) => void,
): Promise<CrawlResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Normalize base URL
  let normalizedBase = baseUrl.trim();
  if (!normalizedBase.startsWith('http')) {
    normalizedBase = 'https://' + normalizedBase;
  }

  // Try sitemap first
  try {
    const sitemapUrls = await crawlSitemap(normalizedBase);
    if (sitemapUrls && sitemapUrls.length > 0) {
      onProgress?.(sitemapUrls.length);
      return {
        baseUrl: normalizedBase,
        method: 'sitemap',
        totalFound: sitemapUrls.length,
        urls: sitemapUrls,
        errors,
        duration: Date.now() - startTime,
      };
    }
  } catch (e) {
    errors.push(`Sitemap crawl failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Fallback to DOM parsing
  try {
    const domUrls = await crawlDom(normalizedBase, onProgress);
    return {
      baseUrl: normalizedBase,
      method: 'dom-parsing',
      totalFound: domUrls.length,
      urls: domUrls,
      errors,
      duration: Date.now() - startTime,
    };
  } catch (e) {
    errors.push(`DOM crawl failed: ${e instanceof Error ? e.message : String(e)}`);
    return {
      baseUrl: normalizedBase,
      method: 'dom-parsing',
      totalFound: 0,
      urls: [],
      errors,
      duration: Date.now() - startTime,
    };
  }
}
