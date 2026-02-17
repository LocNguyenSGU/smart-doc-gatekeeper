import React, { useEffect, useState } from 'react';
import { Search, Zap, CheckCircle, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const ProgressView: React.FC = () => {
  const {
    progress,
    realtimeResults,
    isAnalyzing,
    error,
    url,
    issueDescription,
    setScreen,
  } = useAppStore();

  const [currentStep, setCurrentStep] = useState<'crawling' | 'filtering' | 'done'>('crawling');

  useEffect(() => {
    setCurrentStep(progress.step);
  }, [progress.step]);

  const handleCancel = () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'CANCEL_ANALYSIS' });
    }
    setScreen('input');
  };

  const steps = [
    {
      id: 'crawling',
      name: 'Crawling Documentation',
      description: 'Discovering and indexing documentation pages',
      icon: Search,
      completed: currentStep === 'filtering' || currentStep === 'done',
      active: currentStep === 'crawling',
    },
    {
      id: 'filtering',
      name: 'AI Analysis',
      description: 'Analyzing content relevance with AI',
      icon: Zap,
      completed: currentStep === 'done',
      active: currentStep === 'filtering',
    },
    {
      id: 'done',
      name: 'Complete',
      description: 'Analysis finished successfully',
      icon: CheckCircle,
      completed: currentStep === 'done',
      active: currentStep === 'done',
    },
  ];

  const getRelevanceColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRelevanceBg = (score: number): string => {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 6) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
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

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analysis Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => setScreen('input')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Input</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analyzing Documentation
            </h1>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel Analysis
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Analyzing:</p>
            <p className="font-medium text-gray-900 dark:text-white truncate">{url}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {issueDescription}
            </p>
          </div>
        </div>

        {/* Progress Steps - Compact horizontal version */}
        <div className="flex-shrink-0 px-8 pb-4">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                        ${step.completed 
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-600 dark:text-green-400'
                          : step.active
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
                        }
                      `}
                    >
                      {step.completed ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      step.active || step.completed 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      step.completed 
                        ? 'bg-green-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar - Fixed */}
        <div className="flex-shrink-0 px-8 pb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{progress.message}</span>
            <span>{progress.progress}% complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          {progress.urlsFound > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Found {progress.urlsFound} documentation pages
            </p>
          )}
        </div>

        {/* Live Results - Takes remaining space with scroll */}
        {realtimeResults.length > 0 && (
          <div className="flex-1 px-8 pb-8 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Results ({realtimeResults.length})
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Results appear as they're analyzed
              </div>
            </div>
            <div className="h-full overflow-y-auto pr-4 space-y-4 scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {realtimeResults.slice().reverse().map((result, index) => (
                <div
                  key={`${result.url}-${index}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm animate-fadeIn"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg ${getRelevanceBg(result.relevance)} flex items-center justify-center`}>
                        <span className="text-lg">{getCategoryIcon(result.category)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-4">
                          {result.title}
                        </h4>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${getRelevanceColor(result.relevance)}`}>
                            {result.category}
                          </span>
                          <div className={`text-sm font-semibold ${getRelevanceColor(result.relevance)}`}>
                            {result.relevance.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {result.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic flex-1 pr-4">
                          {result.reason}
                        </p>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 flex-shrink-0"
                        >
                          <FileText size={12} />
                          <span>View</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressView;