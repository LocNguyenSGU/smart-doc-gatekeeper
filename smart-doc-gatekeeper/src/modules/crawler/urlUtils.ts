import { FILTER_CONFIG } from '@/shared/constants';

/**
 * Normalize URL: remove trailing slash, hash fragments, tracking params
 */
export function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(url, baseUrl);
    
    // Remove hash fragments
    parsed.hash = '';
    
    // Remove common tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
    trackingParams.forEach(p => parsed.searchParams.delete(p));
    
    // Remove trailing slash (except for root)
    let normalized = parsed.toString();
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Check if URL is on the same domain as the base URL
 */
export function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const urlHost = new URL(url).hostname;
    const baseHost = new URL(baseUrl).hostname;
    // Allow subdomains: docs.example.com matches example.com
    return urlHost === baseHost || urlHost.endsWith('.' + baseHost) || baseHost.endsWith('.' + urlHost);
  } catch {
    return false;
  }
}

/**
 * Check if URL points to an asset file (not a document page)
 */
export function isAssetUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return FILTER_CONFIG.ASSET_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Get the depth of a URL path relative to base
 */
export function getPathDepth(url: string, baseUrl: string): number {
  try {
    const urlPath = new URL(url).pathname;
    const basePath = new URL(baseUrl).pathname;
    const relative = urlPath.replace(basePath, '');
    return relative.split('/').filter(Boolean).length;
  } catch {
    return 0;
  }
}

/**
 * Deduplicate URLs
 */
export function deduplicateUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}

/**
 * Extract section name from URL path
 */
export function extractSection(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    return parts.length > 1 ? parts[0] : 'root';
  } catch {
    return 'unknown';
  }
}
