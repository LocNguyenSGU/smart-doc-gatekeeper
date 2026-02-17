import { create } from 'zustand';
import type { AppScreen, ProgressState, FilterResult, ScoredUrl } from '@/shared/types';

interface HistoryItem {
  id: string;
  url: string;
  issueDescription: string;
  timestamp: Date;
  resultCount?: number;
}

interface AppState {
  // Core state
  screen: AppScreen;
  url: string;
  issueDescription: string;
  progress: ProgressState;
  result: FilterResult | null;
  error: string | null;
  
  // UI state
  isDarkMode: boolean;
  selectedUrls: Set<string>;
  searchQuery: string;
  sortBy: 'relevance' | 'title' | 'category';
  filterBy: 'all' | 'tutorial' | 'reference' | 'concept' | 'example';
  
  // Real-time results
  realtimeResults: ScoredUrl[];
  isAnalyzing: boolean;
  
  // History
  analysisHistory: HistoryItem[];

  // Actions
  setScreen: (screen: AppScreen) => void;
  setUrl: (url: string) => void;
  setIssueDescription: (desc: string) => void;
  setProgress: (progress: ProgressState) => void;
  setResult: (result: FilterResult) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  
  // UI actions
  toggleDarkMode: () => void;
  toggleUrlSelection: (url: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'relevance' | 'title' | 'category') => void;
  setFilterBy: (filter: 'all' | 'tutorial' | 'reference' | 'concept' | 'example') => void;
  
  // Real-time results actions
  addRealtimeResult: (result: ScoredUrl) => void;
  clearRealtimeResults: () => void;
  
  // History actions
  addToHistory: (url: string, issueDescription: string, resultCount?: number) => void;
  selectFromHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  
  // Reset
  reset: () => void;
  startNewAnalysis: () => void;
}

const initialProgress: ProgressState = {
  step: 'crawling',
  message: '',
  urlsFound: 0,
  progress: 0,
};

// Load dark mode preference from localStorage
const getInitialDarkMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Load history from localStorage
const getInitialHistory = (): HistoryItem[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('analysisHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      } catch (e) {
        console.error('Failed to parse analysis history:', e);
      }
    }
  }
  return [];
};

export const useAppStore = create<AppState>((set, get) => ({
  // Core state
  screen: 'input',
  url: '',
  issueDescription: '',
  progress: initialProgress,
  result: null,
  error: null,
  
  // UI state
  isDarkMode: getInitialDarkMode(),
  selectedUrls: new Set(),
  searchQuery: '',
  sortBy: 'relevance',
  filterBy: 'all',
  
  // Real-time results
  realtimeResults: [],
  isAnalyzing: false,
  
  // History
  analysisHistory: getInitialHistory(),

  // Actions
  setScreen: (screen) => set({ screen }),
  setUrl: (url) => set({ url }),
  setIssueDescription: (issueDescription) => set({ issueDescription }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => {
    const selected = new Set(result.results.map(r => r.url));
    set({ 
      result, 
      selectedUrls: selected, 
      screen: 'results',
      isAnalyzing: false 
    });
  },
  setError: (error) => set({ error, isAnalyzing: false }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  // UI actions
  toggleDarkMode: () => {
    const newMode = !get().isDarkMode;
    set({ isDarkMode: newMode });
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
  
  toggleUrlSelection: (url) => {
    const current = new Set(get().selectedUrls);
    if (current.has(url)) {
      current.delete(url);
    } else {
      current.add(url);
    }
    set({ selectedUrls: current });
  },
  
  selectAll: () => {
    const result = get().result;
    if (result) {
      set({ selectedUrls: new Set(result.results.map(r => r.url)) });
    }
  },
  
  deselectAll: () => set({ selectedUrls: new Set() }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setFilterBy: (filterBy) => set({ filterBy }),
  
  // Real-time results actions
  addRealtimeResult: (result) => {
    const current = get().realtimeResults;
    // Avoid duplicates
    if (!current.find(r => r.url === result.url)) {
      set({ realtimeResults: [...current, result] });
    }
  },
  
  clearRealtimeResults: () => set({ realtimeResults: [] }),
  
  // History actions
  addToHistory: (url, issueDescription, resultCount) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      url,
      issueDescription: issueDescription.substring(0, 100), // Truncate for display
      timestamp: new Date(),
      resultCount,
    };
    
    const current = get().analysisHistory;
    const updated = [newItem, ...current.slice(0, 4)]; // Keep last 5
    
    set({ analysisHistory: updated });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('analysisHistory', JSON.stringify(updated));
    }
  },
  
  selectFromHistory: (item) => {
    set({
      url: item.url,
      issueDescription: item.issueDescription,
      screen: 'input',
    });
  },
  
  clearHistory: () => {
    set({ analysisHistory: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analysisHistory');
    }
  },
  
  // Reset
  reset: () => set({
    screen: 'input',
    progress: initialProgress,
    result: null,
    error: null,
    selectedUrls: new Set(),
    realtimeResults: [],
    isAnalyzing: false,
    searchQuery: '',
  }),
  
  startNewAnalysis: () => {
    set({
      screen: 'progress',
      progress: initialProgress,
      result: null,
      error: null,
      realtimeResults: [],
      isAnalyzing: true,
    });
  },
}));

// Initialize dark mode class on load
if (typeof window !== 'undefined') {
  const isDark = getInitialDarkMode();
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}