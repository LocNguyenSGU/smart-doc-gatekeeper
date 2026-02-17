import React from 'react';
import { useAppStore } from '../store/appStore';

const STEPS = [
  { key: 'crawling', label: 'Crawling' },
  { key: 'filtering', label: 'AI Filtering' },
  { key: 'done', label: 'Done' },
] as const;

export function ProgressScreen() {
  const { progress } = useAppStore();

  const handleCancel = () => {
    chrome.runtime.sendMessage({ type: 'CANCEL_ANALYSIS' });
    useAppStore.getState().reset();
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === progress.step);

  return (
    <div className="p-4 space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  i < currentStepIndex
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{progress.message}</span>
          <span>{progress.progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600">{progress.urlsFound}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">URLs found</div>
      </div>

      {/* Animated dots */}
      <div className="flex justify-center gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Hủy
      </button>
    </div>
  );
}
