import { create } from 'zustand';
import type { AppScreen, ProgressState, FilterResult } from '@/shared/types';

interface AppState {
  screen: AppScreen;
  url: string;
  issueDescription: string;
  progress: ProgressState;
  result: FilterResult | null;
  error: string | null;
  selectedUrls: Set<string>; // For checkbox selection in results

  setScreen: (screen: AppScreen) => void;
  setUrl: (url: string) => void;
  setIssueDescription: (desc: string) => void;
  setProgress: (progress: ProgressState) => void;
  setResult: (result: FilterResult) => void;
  setError: (error: string | null) => void;
  toggleUrlSelection: (url: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  reset: () => void;
}

const initialProgress: ProgressState = {
  step: 'crawling',
  message: '',
  urlsFound: 0,
  progress: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'input',
  url: '',
  issueDescription: '',
  progress: initialProgress,
  result: null,
  error: null,
  selectedUrls: new Set(),

  setScreen: (screen) => set({ screen }),
  setUrl: (url) => set({ url }),
  setIssueDescription: (issueDescription) => set({ issueDescription }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => {
    const selected = new Set(result.results.map(r => r.url));
    set({ result, selectedUrls: selected });
  },
  setError: (error) => set({ error }),
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
  reset: () => set({
    screen: 'input',
    progress: initialProgress,
    result: null,
    error: null,
    selectedUrls: new Set(),
  }),
}));
