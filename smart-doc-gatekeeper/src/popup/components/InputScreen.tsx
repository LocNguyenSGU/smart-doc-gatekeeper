import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';

export function InputScreen() {
  const { url, issueDescription, error, setUrl, setIssueDescription, setScreen, setError } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Vui lòng nhập URL');
      return;
    }
    if (!issueDescription.trim()) {
      setError('Vui lòng mô tả vấn đề của bạn');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await chrome.runtime.sendMessage({
        type: 'START_ANALYSIS',
        payload: { url: url.trim(), issueDescription: issueDescription.trim() },
      });
      setScreen('progress');
    } catch (err) {
      setError('Không thể kết nối đến background service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">URL tài liệu</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.example.com/"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mô tả vấn đề (Issue)</label>
        <textarea
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Ví dụ: Tôi muốn xây dựng hệ thống multi-agent cho dropshipping, cần tìm hiểu cách thiết kế agent, quản lý state và kết nối API..."
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors"
      >
        {loading ? 'Đang khởi động...' : '🔍 Phân tích tài liệu'}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Extension sẽ crawl sitemap/links và dùng AI để lọc tài liệu liên quan nhất.
      </p>
    </form>
  );
}
