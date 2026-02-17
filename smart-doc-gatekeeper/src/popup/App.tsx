import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { InputScreen } from './components/InputScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { ResultsScreen } from './components/ResultsScreen';
import type { ExtensionMessage } from '@/shared/types';

export default function App() {
  const { screen, setScreen, setProgress, setResult, setError } = useAppStore();

  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      switch (message.type) {
        case 'PROGRESS_UPDATE':
          setProgress(message.payload);
          break;
        case 'ANALYSIS_COMPLETE':
          setResult(message.payload);
          setScreen('results');
          break;
        case 'ANALYSIS_ERROR':
          setError(message.payload.error);
          setScreen('input');
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setScreen, setProgress, setResult, setError]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold flex items-center gap-2">
          <span>🔍</span> Smart Doc Gatekeeper
        </h1>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-white/80 hover:text-white text-sm"
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {screen === 'input' && <InputScreen />}
        {screen === 'progress' && <ProgressScreen />}
        {screen === 'results' && <ResultsScreen />}
      </main>
    </div>
  );
}
