import type { FilterResult, ScoredUrl } from '@/shared/types';
import { formatAsMarkdown } from './markdownFormatter';

export type ExportFormat = 'markdown' | 'urllist';

export function getResultsAsUrlList(results: ScoredUrl[]): string {
  return results.map(r => r.url).join('\n');
}

export function exportResults(
  result: FilterResult, 
  baseUrl: string,
  format: ExportFormat = 'markdown'
): string {
  if (format === 'urllist') {
    return getResultsAsUrlList(result.results);
  }
  return formatAsMarkdown(result, baseUrl);
}

export async function copyResultsToClipboard(
  result: FilterResult,
  baseUrl: string,
  format: ExportFormat = 'markdown',
): Promise<void> {
  const content = exportResults(result, baseUrl, format);
  await navigator.clipboard.writeText(content);
}

export function getResultsAsMarkdown(
  result: FilterResult,
  baseUrl: string,
): string {
  return formatAsMarkdown(result, baseUrl);
}
