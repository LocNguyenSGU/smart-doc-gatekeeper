import React, { useMemo, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  ArrowUpDown,
  FileDown,
  Link2,
  BarChart3,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { ScoredUrl } from '@/shared/types';

const ResultsView: React.FC = () => {
  const {
    result,
    selectedUrls,
    searchQuery,
    sortBy,
    filterBy,
    url,
    issueDescription,
    setSearchQuery,
    setSortBy,
    setFilterBy,
    toggleUrlSelection,
    selectAll,
    deselectAll,
    setScreen,
    addToHistory,
  } = useAppStore();

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredAndSortedResults = useMemo(() => {
    if (!result) return [];

    let filtered = result.results.filter((item) => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by category
      const matchesCategory = filterBy === 'all' || item.category === filterBy;

      return matchesSearch && matchesCategory;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevance - a.relevance;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [result, searchQuery, sortBy, filterBy]);

  const getRelevanceColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRelevanceBg = (score: number): string => {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (score >= 6) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tutorial':
        return '📚';
      case 'reference':
        return '📖';
      case 'concept':
        return '💡';
      case 'example':
        return '💻';
      default:
        return '📄';
    }
  };

  const exportMarkdown = () => {
    if (!result) return;
    
    const selectedResults = result.results.filter(r => selectedUrls.has(r.url));
    const targetResults = selectedResults.length > 0 ? selectedResults : filteredAndSortedResults;

    let markdown = `# Documentation Analysis Results\n\n`;
    markdown += `**Issue:** ${issueDescription}\n\n`;
    markdown += `**Source:** [${new URL(url).hostname}](${url})\n\n`;
    markdown += `**Analysis Date:** ${new Date().toLocaleDateString()}\n\n`;
    markdown += `**Results:** ${targetResults.length} of ${result.results.length} total\n\n`;
    markdown += `---\n\n`;

    targetResults.forEach((item, index) => {
      markdown += `## ${index + 1}. ${item.title}\n\n`;
      markdown += `**URL:** [${item.url}](${item.url})\n\n`;
      markdown += `**Relevance Score:** ${item.relevance}/10\n\n`;
      markdown += `**Category:** ${item.category}\n\n`;
      markdown += `**Description:** ${item.description}\n\n`;
      markdown += `**AI Analysis:** ${item.reason}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url_obj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_obj;
    a.download = `documentation-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url_obj);
    setExportDropdownOpen(false);
  };

  const exportUrlList = () => {
    if (!result) return;
    
    const selectedResults = result.results.filter(r => selectedUrls.has(r.url));
    const targetResults = selectedResults.length > 0 ? selectedResults : filteredAndSortedResults;

    const urlList = targetResults.map(item => `${item.url} - ${item.title} (${item.relevance}/10)`).join('\n');

    const blob = new Blob([urlList], { type: 'text/plain' });
    const url_obj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_obj;
    a.download = `documentation-urls-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url_obj);
    setExportDropdownOpen(false);
  };

  const copyUrls = async () => {
    if (!result) return;
    
    const selectedResults = result.results.filter(r => selectedUrls.has(r.url));
    const targetResults = selectedResults.length > 0 ? selectedResults : filteredAndSortedResults;

    const urlList = targetResults.map(item => item.url).join('\n');

    try {
      await navigator.clipboard.writeText(urlList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URLs:', err);
    }
    setExportDropdownOpen(false);
  };

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">No results to display</div>
      </div>
    );
  }

  const selectedCount = selectedUrls.size;
  const allSelected = selectedCount === filteredAndSortedResults.length;
  const someSelected = selectedCount > 0 && selectedCount < filteredAndSortedResults.length;

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => setScreen('input')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Results</h1>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found <span className="font-semibold">{result.results.length}</span> relevant pages • 
                Analysis took <span className="font-semibold">{(result.duration / 1000).toFixed(1)}s</span> • 
                Powered by <span className="font-semibold">{result.provider}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>

                {exportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <button
                        onClick={exportMarkdown}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center space-x-2"
                      >
                        <FileDown size={16} />
                        <span>Markdown Report</span>
                      </button>
                      <button
                        onClick={exportUrlList}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center space-x-2"
                      >
                        <Link2 size={16} />
                        <span>URL List</span>
                      </button>
                      <button
                        onClick={copyUrls}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center space-x-2"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copied ? 'Copied!' : 'Copy URLs'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Found</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{result.totalScanned}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">AI Analyzed</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{result.aiScored}</p>
                </div>
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">High Relevance</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {result.results.filter(r => r.relevance >= 7).length}
                  </p>
                </div>
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Selected</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{selectedCount}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="tutorial">Tutorials</option>
                <option value="reference">Reference</option>
                <option value="concept">Concepts</option>
                <option value="example">Examples</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="title">Sort by Title</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>

            {/* Bulk Selection */}
            <div className="flex items-center space-x-3">
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {allSelected ? <CheckSquare size={16} /> : someSelected ? <Square size={16} className="text-blue-600" /> : <Square size={16} />}
                <span>
                  {allSelected ? 'Deselect All' : someSelected ? `${selectedCount} Selected` : 'Select All'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {filteredAndSortedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Results Found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search query or filter settings.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedResults.map((item) => (
                <div
                  key={item.url}
                  className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-all ${
                    selectedUrls.has(item.url) 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleUrlSelection(item.url)}
                      className="mt-1 flex-shrink-0"
                    >
                      {selectedUrls.has(item.url) ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : (
                        <Square size={20} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg border ${getRelevanceBg(item.relevance)} flex items-center justify-center`}>
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {item.category}
                          </span>
                          <div className={`text-lg font-bold ${getRelevanceColor(item.relevance)}`}>
                            {item.relevance.toFixed(1)}/10
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          <strong>AI Analysis:</strong> {item.reason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mr-4">
                          {item.url}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;