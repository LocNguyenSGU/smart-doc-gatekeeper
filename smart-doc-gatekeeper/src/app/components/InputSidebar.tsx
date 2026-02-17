import React, { useState } from 'react';
import { Search, Clock, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const InputSidebar: React.FC = () => {
  const {
    url,
    issueDescription,
    isAnalyzing,
    analysisHistory,
    setUrl,
    setIssueDescription,
    selectFromHistory,
    clearHistory,
    startNewAnalysis,
    addToHistory,
  } = useAppStore();

  const [urlError, setUrlError] = useState('');
  const [issueError, setIssueError] = useState('');

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value && !validateUrl(value)) {
      setUrlError('Please enter a valid HTTP or HTTPS URL');
    } else {
      setUrlError('');
    }
  };

  const handleIssueChange = (value: string) => {
    setIssueDescription(value);
    if (value.length === 0) {
      setIssueError('Please describe your issue');
    } else if (value.length < 10) {
      setIssueError('Please provide more details (minimum 10 characters)');
    } else {
      setIssueError('');
    }
  };

  const handleAnalyze = async () => {
    // Validate inputs
    let hasErrors = false;

    if (!url) {
      setUrlError('URL is required');
      hasErrors = true;
    } else if (!validateUrl(url)) {
      setUrlError('Please enter a valid HTTP or HTTPS URL');
      hasErrors = true;
    }

    if (!issueDescription) {
      setIssueError('Issue description is required');
      hasErrors = true;
    } else if (issueDescription.length < 10) {
      setIssueError('Please provide more details (minimum 10 characters)');
      hasErrors = true;
    }

    if (hasErrors) return;

    // Start analysis
    startNewAnalysis();
    
    // Send message to background script
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'START_ANALYSIS',
        payload: { url, issueDescription }
      });
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Analyze Documentation
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter a documentation URL and describe your issue to get AI-powered recommendations.
        </p>
      </div>

      <div className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Documentation URL
          </label>
          <div className="relative">
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://docs.example.com"
              className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                urlError 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isAnalyzing}
            />
            <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
          </div>
          {urlError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{urlError}</p>
          )}
        </div>

        {/* Issue Description */}
        <div>
          <label htmlFor="issue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Describe Your Issue
          </label>
          <textarea
            id="issue"
            value={issueDescription}
            onChange={(e) => handleIssueChange(e.target.value)}
            placeholder="I'm trying to implement authentication in my React app and need to understand how to set up JWT tokens with refresh logic..."
            rows={5}
            className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
              issueError 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isAnalyzing}
          />
          <div className="mt-2 flex justify-between items-center">
            {issueError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{issueError}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {issueDescription.length}/1000 characters
              </p>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !!urlError || !!issueError || !url || !issueDescription}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Analyze Documentation</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recent Analyses
            </h3>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center space-x-1"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
          <div className="space-y-2">
            {analysisHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => selectFromHistory(item)}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
                disabled={isAnalyzing}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {new URL(item.url).hostname}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {item.issueDescription}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={10} />
                        <span>{formatTimeAgo(item.timestamp)}</span>
                      </div>
                      {item.resultCount && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {item.resultCount} results
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight 
                    size={14} 
                    className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-2 mt-1 transition-colors" 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InputSidebar;