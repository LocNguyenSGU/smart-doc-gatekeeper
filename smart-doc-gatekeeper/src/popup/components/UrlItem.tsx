import React, { useState } from 'react';
import type { ScoredUrl } from '@/shared/types';

interface Props {
  item: ScoredUrl;
  selected: boolean;
  onToggle: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  if (score >= 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
}

export function UrlItem({ item, selected, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-2.5 text-sm transition-colors ${
      selected
        ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium truncate block"
              title={item.url}
            >
              {item.title || item.path || item.url}
            </a>
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-bold ${getScoreColor(item.relevance)}`}>
              {item.relevance}/10
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {item.url}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1"
          >
            {expanded ? '▼ Ẩn lý do' : '▶ Xem lý do'}
          </button>
          {expanded && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
              → {item.reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
