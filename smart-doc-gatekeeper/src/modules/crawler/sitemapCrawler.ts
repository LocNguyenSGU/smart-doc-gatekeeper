import { XMLParser } from 'fast-xml-parser';
import type { UrlMetadata } from '@/shared/types';
import { CRAWL_CONFIG } from '@/shared/constants';
import { normalizeUrl, isSameDomain, isAssetUrl, extractSection } from './urlUtils';

const parser = new XMLParser({ ignoreAttributes: false });

const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap-index.xml', '/sitemap_index.xml'];

/**
 * Attempt to fetch and parse a sitemap from the given URL.
 * Returns parsed XML object or null if fetch/parse fails.
 */
async function fetchSitemap(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const text = await response.text();
    if (!text.includes('<urlset') && !text.includes('<sitemapindex')) {
      return null;
    }

    return parser.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extract <loc> URLs from a parsed sitemap XML object.
 * Handles both single entry and array of entries.
 */
function extractLocs(entries: unknown): string[] {
  if (!entries) return [];

  const items = Array.isArray(entries) ? entries : [entries];
  const locs: string[] = [];

  for (const item of items) {
    if (typeof item === 'object' && item !== null && 'loc' in item) {
      const loc = (item as Record<string, unknown>).loc;
      if (typeof loc === 'string') {
        locs.push(loc);
      }
    }
  }

  return locs;
}

/**
 * Recursively resolve sitemap index files and collect all URLs.
 * A sitemap index contains <sitemap><loc>...</loc></sitemap> entries
 * pointing to other sitemaps.
 */
async function resolveSitemapUrls(
  parsed: Record<string, unknown>,
  baseUrl: string,
  depth: number = 0,
): Promise<string[]> {
  // Guard against infinite recursion
  if (depth > 3) return [];

  const allUrls: string[] = [];

  // Handle sitemap index: <sitemapindex><sitemap><loc>…</loc></sitemap></sitemapindex>
  const sitemapIndex = parsed['sitemapindex'] as Record<string, unknown> | undefined;
  if (sitemapIndex) {
    const sitemapEntries = sitemapIndex['sitemap'];
    const childSitemapLocs = extractLocs(sitemapEntries);

    // Fetch each child sitemap in sequence to be polite
    for (const childLoc of childSitemapLocs) {
      if (allUrls.length >= CRAWL_CONFIG.MAX_URLS) break;

      const childParsed = await fetchSitemap(childLoc);
      if (childParsed) {
        const childUrls = await resolveSitemapUrls(childParsed, baseUrl, depth + 1);
        allUrls.push(...childUrls);
      }
    }

    return allUrls;
  }

  // Handle regular sitemap: <urlset><url><loc>…</loc></url></urlset>
  const urlset = parsed['urlset'] as Record<string, unknown> | undefined;
  if (urlset) {
    const urlEntries = urlset['url'];
    const locs = extractLocs(urlEntries);
    allUrls.push(...locs);
  }

  return allUrls;
}

/**
 * Crawl sitemap(s) for the given base URL.
 * Tries standard sitemap paths, parses XML, resolves sitemap indexes,
 * filters and normalizes URLs, and returns UrlMetadata[].
 *
 * Returns null if no sitemap is found at any standard path.
 */
export async function crawlSitemap(baseUrl: string): Promise<UrlMetadata[] | null> {
  let parsed: Record<string, unknown> | null = null;

  // Try each standard sitemap path
  for (const path of SITEMAP_PATHS) {
    const sitemapUrl = new URL(path, baseUrl).toString();
    parsed = await fetchSitemap(sitemapUrl);
    if (parsed) break;
  }

  if (!parsed) return null;

  // Resolve all URLs (handles sitemap index recursion)
  const rawUrls = await resolveSitemapUrls(parsed, baseUrl);

  if (rawUrls.length === 0) return null;

  // Filter and normalize
  const seen = new Set<string>();
  const results: UrlMetadata[] = [];

  for (const rawUrl of rawUrls) {
    if (results.length >= CRAWL_CONFIG.MAX_URLS) break;

    // Must be same domain
    if (!isSameDomain(rawUrl, baseUrl)) continue;

    // Skip asset files
    if (isAssetUrl(rawUrl)) continue;

    // Normalize
    const normalized = normalizeUrl(rawUrl, baseUrl);
    if (!normalized) continue;

    // Deduplicate
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    results.push({
      url: normalized,
      title: '',
      description: '',
      path: new URL(normalized).pathname,
      section: extractSection(normalized),
    });
  }

  return results.length > 0 ? results : null;
}
