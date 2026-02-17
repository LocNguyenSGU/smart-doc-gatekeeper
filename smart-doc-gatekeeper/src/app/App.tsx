import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';
import type { ExtensionMessage } from '@/shared/types';
import { useAppStore } from './store/appStore';
import InputSidebar from './components/InputSidebar';
import ProgressView from './components/ProgressView';
import ResultsView from './components/ResultsView';

const App: React.FC = () => {
  const { 
    screen, 
    toggleDarkMode, 
    isDarkMode,
    url,
    issueDescription,
    setProgress,
    setResult,
    setError,
    setScreen,
    setIsAnalyzing,
    addRealtimeResult,
    addToHistory
  } = useAppStore();

  // Listen for messages from background script
  useEffect(() => {
    const handleMessage = (message: ExtensionMessage) => {
      console.log('App received message:', message);
      
      switch (message.type) {
        case 'PROGRESS_UPDATE':
          setProgress(message.payload);
          if (screen !== 'progress') {
            setScreen('progress');
          }
          break;
        
        case 'REALTIME_RESULT':
          addRealtimeResult(message.payload.result);
          break;
        
        case 'ANALYSIS_COMPLETE':
          setResult(message.payload);
          setIsAnalyzing(false);
          setScreen('results');
          // Auto-save to history with full results
          addToHistory(url, issueDescription, message.payload.results?.length || 0, message.payload);
          break;
        
        case 'ANALYSIS_ERROR':
          setError(message.payload.error);
          setIsAnalyzing(false);
          break;
      }
    };

    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, [screen, setProgress, setResult, setError, setScreen, setIsAnalyzing, addRealtimeResult, addToHistory, url, issueDescription]);

  const openOptions = () => {
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart Doc Gatekeeper</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered documentation analysis</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Toggle dark mode"
                >
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={openOptions}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Open settings"
                >
                  <Settings size={18} />
                  <span className="text-sm font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-1 h-[calc(100vh-64px)]">
          {/* Sidebar - Only show on input screen */}
          {screen === 'input' && (
            <div className="w-96 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <InputSidebar />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-gray-900">
            {screen === 'progress' && <ProgressView />}
            {screen === 'results' && <ResultsView />}
            {screen === 'input' && (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to Smart Doc Gatekeeper
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter a documentation URL and describe your issue in the sidebar to get started with AI-powered analysis.
                  </p>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      <span>AI-powered relevance scoring</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      <span>Real-time progress tracking</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      <span>Export results in multiple formats</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;