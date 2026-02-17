import type {
  ExtensionMessage,
  StartAnalysisMessage,
  FilterResult,
  RealtimeResultMessage,
} from '@/shared/types';
import { getSettings } from '@/shared/storage';
import { crawl } from '@/modules/crawler';
import { filterUrls } from '@/modules/filter';
import { createAIAdapter } from '@/modules/ai';

let isAnalyzing = false;
let abortController: AbortController | null = null;
let activeTabId: number | null = null;
let extensionTabId: number | null = null; // Track the extension's tab ID

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === 'START_ANALYSIS') {
      activeTabId = extensionTabId || sender.tab?.id || null;
      handleStartAnalysis(message);
      sendResponse({ ok: true });
    } else if (message.type === 'CANCEL_ANALYSIS') {
      handleCancel();
      sendResponse({ ok: true });
    }
    return true; // Keep message channel open for async
  }
);

// Forward realtime results to active tab
function sendRealtimeResult(message: RealtimeResultMessage) {
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, message).catch(() => {
      // Tab may be closed or no content script listening, ignore
    });
  }
  
  // Also send to popup if it's listening
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup may be closed, ignore
  });
}

function sendProgress(step: 'crawling' | 'filtering' | 'done', message: string, urlsFound: number, progress: number) {
  chrome.runtime.sendMessage({
    type: 'PROGRESS_UPDATE',
    payload: { step, message, urlsFound, progress },
  }).catch(() => {
    // Popup may be closed, ignore
  });
}

async function handleStartAnalysis(message: StartAnalysisMessage) {
  if (isAnalyzing) return;
  isAnalyzing = true;
  abortController = new AbortController();

  const { url, issueDescription } = message.payload;

  try {
    // Step 1: Crawl
    sendProgress('crawling', 'Đang tìm sitemap...', 0, 10);

    const crawlResult = await crawl(url, (found) => {
      sendProgress('crawling', `Đã tìm thấy ${found} URLs...`, found, 30);
    });

    if (abortController.signal.aborted) return;

    sendProgress('crawling', `Crawl hoàn tất: ${crawlResult.totalFound} URLs (${crawlResult.method})`, crawlResult.totalFound, 40);

    if (crawlResult.urls.length === 0) {
      chrome.runtime.sendMessage({
        type: 'ANALYSIS_ERROR',
        payload: { error: 'Không tìm thấy URL nào. Kiểm tra lại URL gốc.' },
      }).catch(() => {});
      return;
    }

    // Step 2: Filter with AI
    sendProgress('filtering', 'Đang phân tích với AI...', crawlResult.totalFound, 50);

    const settings = await getSettings();
    const adapter = createAIAdapter(settings.provider);

    const filterResult: FilterResult = await filterUrls(
      adapter,
      crawlResult.urls,
      issueDescription,
      settings.maxResults,
      (scored, total) => {
        const pct = 50 + Math.round((scored / total) * 40);
        sendProgress('filtering', `AI đã đánh giá ${scored}/${total} URLs...`, crawlResult.totalFound, pct);
      },
      (result, batchProgress) => {
        // Send realtime results to active tab
        sendRealtimeResult({
          type: 'REALTIME_RESULT',
          payload: { result, batchProgress },
        });
      },
    );

    if (abortController.signal.aborted) return;

    // Step 3: Done
    sendProgress('done', 'Hoàn tất!', crawlResult.totalFound, 100);

    chrome.runtime.sendMessage({
      type: 'ANALYSIS_COMPLETE',
      payload: filterResult,
    }).catch(() => {});

  } catch (error) {
    console.error('Analysis failed:', error);
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi phân tích',
      },
    }).catch(() => {});
  } finally {
    isAnalyzing = false;
    abortController = null;
  }
}

function handleCancel() {
  if (abortController) {
    abortController.abort();
  }
  isAnalyzing = false;
  abortController = null;
}

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Doc Gatekeeper installed');
});

// Open app tab when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL('src/app/index.html');
  chrome.tabs.create({ url }, (tab) => {
    extensionTabId = tab.id || null;
  });
});
