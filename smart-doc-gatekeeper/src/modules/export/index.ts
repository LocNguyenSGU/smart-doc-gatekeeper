import type { FilterResult } from '@/shared/types';
import { formatAsMarkdown } from './markdownFormatter';

export async function copyResultsToClipboard(
  result: FilterResult,
  baseUrl: string,
): Promise<void> {
  const markdown = formatAsMarkdown(result, baseUrl);
  await navigator.clipboard.writeText(markdown);
}

export function getResultsAsMarkdown(
  result: FilterResult,
  baseUrl: string,
): string {
  return formatAsMarkdown(result, baseUrl);
}
