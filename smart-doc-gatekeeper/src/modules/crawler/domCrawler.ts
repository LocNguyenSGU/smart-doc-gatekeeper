import type { UrlMetadata } from '@/shared/types';
import { CRAWL_CONFIG } from '@/shared/constants';
import { normalizeUrl, isSameDomain, isAssetUrl, deduplicateUrls, extractSection } from './urlUtils';

/** Navigation-related selectors, ordered by specificity */
const NAV_SELECTORS = [
  'nav',
  'aside',
  '[role="navigation"]',
  '.sidebar',
  '.menu',
  '.toc',
  '.docs-nav',
  '.doc-sidebar',
];

/**
 * Fetch a page with timeout and return its HTML text.
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      headers: { 'Accept': 'text/html, */*' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Parse HTML string and return a Document.
 */
function parseHtml(html: string): Document {
  const domParser = new DOMParser();
  return domParser.parseFromString(html, 'text/html');
}

/**
 * Extract title from a parsed HTML document.
 */
function extractTitle(doc: Document): string {
  return doc.querySelector('title')?.textContent?.trim() ?? '';
}

/**
 * Extract meta description from a parsed HTML document.
 */
function extractDescription(doc: Document): string {
  const meta = doc.querySelector('meta[name="description"]');
  return meta?.getAttribute('content')?.trim() ?? '';
}

/**
 * Extract links from navigation elements in the document.
 * Falls back to all links on the page if no nav elements are found.
 */
function extractLinks(doc: Document, baseUrl: string): string[] {
  const links: string[] = [];

  // Try navigation elements first
  let navElements: Element[] = [];
  for (const selector of NAV_SELECTORS) {
    const found = doc.querySelectorAll(selector);
    if (found.length > 0) {
      navElements.push(...Array.from(found));
    }
  }

  let anchors: HTMLAnchorElement[];

  if (navElements.length > 0) {
    // Extract links from nav elements only
    const anchorSet = new Set<HTMLAnchorElement>();
    for (const nav of navElements) {
      const navAnchors = nav.querySelectorAll('a[href]');
      navAnchors.forEach(a => anchorSet.add(a as HTMLAnchorElement));
    }
    anchors = Array.from(anchorSet);
  } else {
    // Fallback: extract all links from the page
    anchors = Array.from(doc.querySelectorAll('a[href]'));
  }

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    if (!href) continue;

    // Skip non-http links
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }

    const normalized = normalizeUrl(href, baseUrl);
    if (!normalized) continue;

    // Must be same domain
    if (!isSameDomain(normalized, baseUrl)) continue;

    // Skip assets
    if (isAssetUrl(normalized)) continue;

    links.push(normalized);
  }

  return deduplicateUrls(links);
}

/**
 * Simple concurrency pool: runs async tasks with a max concurrency limit.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  // Spawn workers up to the concurrency limit
  const workers = Array.from(
    { length: Math.min(maxConcurrent, tasks.length) },
    () => runNext(),
  );

  await Promise.all(workers);
  return results;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crawl documentation pages starting from a base URL using DOM parsing.
 * Discovers links through navigation elements, then recursively crawls
 * found pages up to MAX_DEPTH. Uses concurrent fetching with a concurrency
 * limit and delay between batches.
 */
export async function crawlDom(
  baseUrl: string,
  onProgress?: (found: number) => void,
): Promise<UrlMetadata[]> {
  const visited = new Set<string>();
  const results = new Map<string, UrlMetadata>();

  // Seed with the base URL
  let currentBatch = [baseUrl];
  let depth = 0;

  while (currentBatch.length > 0 && depth < CRAWL_CONFIG.MAX_DEPTH) {
    // Filter out already-visited URLs and respect MAX_URLS
    const toFetch = currentBatch.filter(url => {
      if (visited.has(url)) return false;
      if (results.size >= CRAWL_CONFIG.MAX_URLS) return false;
      visited.add(url);
      return true;
    });

    if (toFetch.length === 0) break;

    // Create fetch tasks
    const tasks = toFetch.map(url => async () => {
      const html = await fetchPage(url);
      if (!html) return { url, links: [] as string[] };

      const doc = parseHtml(html);
      const title = extractTitle(doc);
      const description = extractDescription(doc);
      const links = extractLinks(doc, baseUrl);

      // Store result
      if (results.size < CRAWL_CONFIG.MAX_URLS) {
        results.set(url, {
          url,
          title,
          description,
          path: new URL(url).pathname,
          section: extractSection(url),
        });

        onProgress?.(results.size);
      }

      return { url, links };
    });

    // Run with concurrency limit
    const batchResults = await runWithConcurrency(tasks, CRAWL_CONFIG.MAX_CONCURRENT);

    // Collect next batch of URLs to crawl
    const nextBatch: string[] = [];
    for (const result of batchResults) {
      for (const link of result.links) {
        if (!visited.has(link) && !results.has(link) && results.size + nextBatch.length < CRAWL_CONFIG.MAX_URLS) {
          nextBatch.push(link);
        }
      }
    }

    currentBatch = deduplicateUrls(nextBatch);
    depth++;

    // Delay between batches to be polite
    if (currentBatch.length > 0) {
      await delay(CRAWL_CONFIG.REQUEST_DELAY_MS);
    }
  }

  return Array.from(results.values());
}
