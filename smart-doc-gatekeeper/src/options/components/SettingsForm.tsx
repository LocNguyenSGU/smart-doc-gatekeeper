import React, { useState, useEffect } from 'react';
import type { AIProviderName, ExtensionSettings } from '@/shared/types';
import { PROVIDER_MODELS, PROVIDER_ENDPOINTS, DEFAULT_SETTINGS } from '@/shared/constants';
import { getSettings, saveSettings } from '@/shared/storage';
import { createAIAdapter } from '@/modules/ai';

const PROVIDER_LABELS: Record<AIProviderName, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  deepseek: 'DeepSeek',
  ollama: 'Ollama (Local)',
};

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export function SettingsForm() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((saved) => {
      setSettings(saved);
      setLoading(false);
    });
  }, []);

  // Reset model when provider changes
  const handleProviderChange = (name: AIProviderName) => {
    const models = PROVIDER_MODELS[name];
    setSettings((prev) => ({
      ...prev,
      provider: {
        ...prev.provider,
        name,
        model: models[0],
        endpoint: name === 'ollama' ? (prev.provider.endpoint || PROVIDER_ENDPOINTS.ollama) : undefined,
      },
    }));
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestMessage('');
    try {
      const adapter = createAIAdapter(settings.provider);
      const ok = await adapter.testConnection();
      if (ok) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage('Connection failed. Check your settings.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err?.message ?? 'Connection failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(settings);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isOllama = settings.provider.name === 'ollama';

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* ── AI Provider Section ── */}
      <Card title="AI Provider">
        {/* Provider */}
        <Label htmlFor="provider">Provider</Label>
        <select
          id="provider"
          value={settings.provider.name}
          onChange={(e) => handleProviderChange(e.target.value as AIProviderName)}
          className="input-base"
        >
          {(Object.keys(PROVIDER_LABELS) as AIProviderName[]).map((key) => (
            <option key={key} value={key}>
              {PROVIDER_LABELS[key]}
            </option>
          ))}
        </select>

        {/* API Key */}
        {!isOllama && (
          <>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={settings.provider.apiKey}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    provider: { ...p.provider, apiKey: e.target.value },
                  }))
                }
                placeholder="sk-…"
                className="input-base pr-16"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </>
        )}

        {/* Model */}
        <Label htmlFor="model">Model</Label>
        <select
          id="model"
          value={settings.provider.model}
          onChange={(e) =>
            setSettings((p) => ({
              ...p,
              provider: { ...p.provider, model: e.target.value },
            }))
          }
          className="input-base"
        >
          {PROVIDER_MODELS[settings.provider.name].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Ollama Endpoint */}
        {isOllama && (
          <>
            <Label htmlFor="endpoint">Ollama Endpoint URL</Label>
            <input
              id="endpoint"
              type="url"
              value={settings.provider.endpoint ?? PROVIDER_ENDPOINTS.ollama}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  provider: { ...p.provider, endpoint: e.target.value },
                }))
              }
              placeholder={PROVIDER_ENDPOINTS.ollama}
              className="input-base"
            />
          </>
        )}

        {/* Test Connection */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'loading'}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {testStatus === 'loading' && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Test Connection
          </button>

          {testStatus === 'success' && (
            <span className="ml-3 inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              ✅ {testMessage}
            </span>
          )}
          {testStatus === 'error' && (
            <span className="ml-3 inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
              ❌ {testMessage}
            </span>
          )}
        </div>
      </Card>

      {/* ── Crawling & Filtering Section ── */}
      <Card title="Crawling &amp; Filtering">
        {/* Max URLs */}
        <Label htmlFor="maxUrls">
          Max URLs to crawl: <strong>{settings.maxUrls}</strong>
        </Label>
        <input
          id="maxUrls"
          type="range"
          min={50}
          max={200}
          step={10}
          value={settings.maxUrls}
          onChange={(e) =>
            setSettings((p) => ({ ...p, maxUrls: Number(e.target.value) }))
          }
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>50</span>
          <span>200</span>
        </div>

        {/* Max Results */}
        <Label htmlFor="maxResults">
          Max results to return: <strong>{settings.maxResults}</strong>
        </Label>
        <input
          id="maxResults"
          type="range"
          min={5}
          max={30}
          step={1}
          value={settings.maxResults}
          onChange={(e) =>
            setSettings((p) => ({ ...p, maxResults: Number(e.target.value) }))
          }
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>5</span>
          <span>30</span>
        </div>
      </Card>

      {/* ── Save ── */}
      <div className="relative">
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>

        {/* Toast */}
        {saveToast && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg animate-fade-in">
            ✓ Settings saved
          </div>
        )}
      </div>
    </form>
  );
}

/* ── Reusable sub-components ── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <legend className="px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
        {title}
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
    </label>
  );
}
