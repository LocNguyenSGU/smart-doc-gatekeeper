import type { ExtensionSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

export async function getSettings(): Promise<ExtensionSettings> {
  try {
    const result = await chrome.storage.local.get('settings');
    return result.settings ? { ...DEFAULT_SETTINGS, ...result.settings } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function getHistory(): Promise<Array<{ date: string; url: string; issue: string }>> {
  try {
    const result = await chrome.storage.local.get('history');
    return (result.history as Array<{ date: string; url: string; issue: string }>) || [];
  } catch {
    return [];
  }
}

export async function addToHistory(entry: { url: string; issue: string }): Promise<void> {
  const history = await getHistory();
  history.unshift({ ...entry, date: new Date().toISOString() });
  // Keep only last 20 entries
  await chrome.storage.local.set({ history: history.slice(0, 20) });
}
