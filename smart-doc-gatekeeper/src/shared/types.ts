// AI Provider types
export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama';

export interface AIProviderConfig {
  name: AIProviderName;
  apiKey: string;
  model: string;
  endpoint?: string; // For Ollama custom endpoint
}

export interface UrlMetadata {
  url: string;
  title: string;
  description: string;
  path: string;
  section?: string;
}

export type UrlCategory = 'tutorial' | 'reference' | 'concept' | 'example';

export interface ScoredUrl extends UrlMetadata {
  relevance: number; // 0-10
  category: UrlCategory;
  reason: string;
}

export interface CrawlResult {
  baseUrl: string;
  method: 'sitemap' | 'dom-parsing';
  totalFound: number;
  urls: UrlMetadata[];
  errors: string[];
  duration: number;
}

export interface FilterResult {
  issueDescription: string;
  totalScanned: number;
  preFiltered: number;
  aiScored: number;
  results: ScoredUrl[];
  provider: string;
  duration: number;
}

// App state
export type AppScreen = 'input' | 'progress' | 'results';

export interface ProgressState {
  step: 'crawling' | 'filtering' | 'done';
  message: string;
  urlsFound: number;
  progress: number; // 0-100
}

// Message types for background communication
export type MessageType = 'START_ANALYSIS' | 'CANCEL_ANALYSIS' | 'PROGRESS_UPDATE' | 'ANALYSIS_COMPLETE' | 'ANALYSIS_ERROR';

export interface StartAnalysisMessage {
  type: 'START_ANALYSIS';
  payload: {
    url: string;
    issueDescription: string;
  };
}

export interface CancelAnalysisMessage {
  type: 'CANCEL_ANALYSIS';
}

export interface ProgressUpdateMessage {
  type: 'PROGRESS_UPDATE';
  payload: ProgressState;
}

export interface AnalysisCompleteMessage {
  type: 'ANALYSIS_COMPLETE';
  payload: FilterResult;
}

export interface AnalysisErrorMessage {
  type: 'ANALYSIS_ERROR';
  payload: { error: string };
}

export interface RealtimeResultMessage {
  type: 'REALTIME_RESULT';
  payload: {
    result: ScoredUrl;
    batchProgress: { current: number; total: number };
  };
}

export type ExtensionMessage =
  | StartAnalysisMessage
  | CancelAnalysisMessage
  | ProgressUpdateMessage
  | AnalysisCompleteMessage
  | AnalysisErrorMessage
  | RealtimeResultMessage;

// Settings stored in chrome.storage
export interface ExtensionSettings {
  provider: AIProviderConfig;
  maxUrls: number;
  maxResults: number;
}
