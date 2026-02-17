import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { UrlItem } from './UrlItem';
import { getResultsAsMarkdown } from '@/modules/export';
import type { ScoredUrl, UrlCategory } from '@/shared/types';

const CATEGORY_LABELS: Record<UrlCategory, string> = {
  tutorial: '📖 Tutorials',
  concept: '💡 Concepts',
  reference: '📚 References',
  example: '💻 Examples',
};

const CATEGORY_ORDER: UrlCategory[] = ['tutorial', 'concept', 'reference', 'example'];

export function ResultsScreen() {
  const { result, url, selectedUrls, toggleUrlSelection, selectAll, deselectAll, reset } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  // Group by category
  const grouped = new Map<UrlCategory, ScoredUrl[]>();
  for (const item of result.results) {
    const list = grouped.get(item.category) || [];
    list.push(item);
    grouped.set(item.category, list);
  }

  const handleCopy = async () => {
    // Build filtered result with only selected URLs
    const filteredResult = {
      ...result,
      results: result.results.filter(r => selectedUrls.has(r.url)),
    };
    const markdown = getResultsAsMarkdown(filteredResult, url);
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allSelected = result.results.every(r => selectedUrls.has(r.url));

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
          <span>
            Quét <strong>{result.totalScanned}</strong> URLs → Chọn <strong>{result.results.length}</strong> liên quan
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          AI: {result.provider} · {(result.duration / 1000).toFixed(1)}s · Pre-filtered: {result.preFiltered}
        </div>
      </div>

      {/* Select all / deselect */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
        <span className="text-gray-500">{selectedUrls.size} selected</span>
        <button
          onClick={allSelected ? deselectAll : selectAll}
          className="text-blue-600 hover:text-blue-700"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {CATEGORY_ORDER.map(category => {
          const items = grouped.get(category);
          if (!items || items.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {CATEGORY_LABELS[category]} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map(item => (
                  <UrlItem
                    key={item.url}
                    item={item}
                    selected={selectedUrls.has(item.url)}
                    onToggle={() => toggleUrlSelection(item.url)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
        <button
          onClick={handleCopy}
          disabled={selectedUrls.size === 0}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
        >
          {copied ? '✓ Đã copy!' : `📋 Copy to Clipboard (${selectedUrls.size})`}
        </button>
        <button
          onClick={reset}
          className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          🔄 Phân tích lại
        </button>
      </div>
    </div>
  );
}
