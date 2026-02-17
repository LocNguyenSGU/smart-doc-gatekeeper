# Smart Doc Gatekeeper — Chrome Extension Design

**Date:** 2026-02-17  
**Status:** Draft  
**Scope:** MVP (F1 Crawl + F2 AI Filter + F4 Export)

---

## 1. Overview

Chrome Extension standalone (Manifest V3) giúp người dùng tự động thu thập, phân loại và lọc tài liệu từ các documentation website. Mục tiêu: giảm thời gian đọc docs thủ công, chỉ đưa các tài liệu liên quan nhất vào NotebookLM để RAG.

**Workflow tổng quát:**
1. User nhập URL gốc + mô tả vấn đề (Issue A)
2. Extension crawl sitemap/DOM để lấy danh sách URLs
3. AI phân loại + scoring từng URL theo độ liên quan
4. User review kết quả → Copy to Clipboard → Paste vào NotebookLM

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│               Chrome Extension (MV3)             │
│                                                   │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Popup   │  │ Background │  │   Content     │  │
│  │   UI     │──│  Service   │──│   Script      │  │
│  │ (React)  │  │  Worker    │  │  (optional)   │  │
│  └──────────┘  └────────────┘  └──────────────┘  │
│                      │                            │
│         ┌────────────┼────────────┐               │
│         ▼            ▼            ▼               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│   │ Crawler  │ │AI Filter │ │ Exporter │         │
│   │ Module   │ │ Module   │ │ Module   │         │
│   └──────────┘ └──────────┘ └──────────┘         │
│                      │                            │
│         ┌────────────┼────────────┐               │
│         ▼            ▼            ▼               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│   │ OpenAI   │ │ Gemini   │ │ Ollama   │         │
│   │Anthropic │ │ DeepSeek │ │ (Local)  │         │
│   └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘
```

### Components

- **Popup UI (React + TailwindCSS):** Giao diện nhập URL, xem kết quả, cấu hình settings
- **Background Service Worker:** Logic crawl, gọi AI API, quản lý state
- **Content Script (optional):** Chỉ dùng khi cần parse DOM của trang đang mở
- **Chrome Storage:** Lưu settings, lịch sử phân tích, cached results

---

## 3. AI Provider Layer

Hỗ trợ 5 providers thông qua **AI Adapter pattern** — mỗi provider có adapter riêng, chung interface.

| Provider  | Models                        | Ưu điểm                    |
|-----------|-------------------------------|-----------------------------|
| OpenAI    | GPT-4o-mini, GPT-4o          | Nhanh, ổn định              |
| Anthropic | Claude Haiku, Sonnet          | Reasoning tốt               |
| Gemini    | Gemini Flash, Gemini Pro      | Rẻ, context window lớn      |
| DeepSeek  | DeepSeek Chat, Reasoner       | Rẻ, reasoning mạnh          |
| Ollama    | Llama, Mistral, Qwen, etc.   | Offline, bảo mật            |

### AI Adapter Interface

```typescript
interface AIAdapter {
  name: string;
  
  // Kiểm tra kết nối + API key hợp lệ
  testConnection(): Promise<boolean>;
  
  // Scoring batch URLs
  scoreUrls(params: {
    issueDescription: string;
    urls: UrlMetadata[];
  }): Promise<ScoredUrl[]>;
}

interface UrlMetadata {
  url: string;
  title: string;
  description: string;
  path: string;
  section?: string;
}

interface ScoredUrl {
  url: string;
  relevance: number;       // 0-10
  category: 'tutorial' | 'reference' | 'concept' | 'example';
  reason: string;
}
```

### Prompt Template

```
Bạn là chuyên gia phân tích tài liệu kỹ thuật.

VẤN ĐỀ CỦA USER: {issueDescription}

Hãy đánh giá các URL tài liệu sau. Với mỗi URL, cho biết:
- relevance (0-10): độ liên quan với vấn đề
- category: tutorial | reference | concept | example
- reason: lý do ngắn gọn (1 câu)

Trả về JSON array.

URLs:
{batchUrls - title, description, path}
```

**Tối ưu chi phí:** Chỉ gửi title + description + path (không full content). ~500 tokens/batch 20 URLs.

---

## 4. Crawler Module

### Luồng Hybrid: Sitemap-first, fallback DOM parsing

```
Input: URL gốc
    │
    ▼
┌─────────────────┐
│ Tìm sitemap.xml │──→ GET /sitemap.xml
│                  │    GET /sitemap-index.xml  
│                  │    GET /sitemap_index.xml
└────────┬────────┘
         │
   Có sitemap?
    ├── YES → Parse XML → Lấy tất cả <loc> URLs
    │         Filter cùng domain
    │
    └── NO → Fallback: DOM Parsing
              │
              ▼
        GET trang gốc HTML
              │
              ▼
        Parse navigation elements:
        - <nav>
        - <aside>
        - [role="navigation"]
        - .sidebar, .menu, .toc
              │
              ▼
        Trích xuất <a href> trong vùng navigation
              │
              ▼
        Recursive crawl (max depth=2, cùng domain)
```

### Quy tắc

- Chỉ crawl cùng domain/subdomain với URL gốc
- Giới hạn tối đa **200 URLs**
- Loại bỏ: duplicates, anchors (#), tracking params
- Bỏ qua: assets (.js, .css, .png, .svg), login/auth pages, 404s
- Rate limiting: max 5 concurrent requests, 200ms delay

### Output

```typescript
interface CrawlResult {
  baseUrl: string;
  method: 'sitemap' | 'dom-parsing';
  totalFound: number;
  urls: UrlMetadata[];
  errors: string[];
  duration: number; // ms
}
```

---

## 5. AI Filter Module

### Luồng xử lý

```
Input: CrawlResult.urls[] + issueDescription
         │
         ▼
   ┌──────────────────┐
   │ Pre-filter (rule) │  Loại bỏ bằng regex pattern:
   │                    │  /privacy|terms|contact|login|404|
   │                    │   changelog|release-notes|contributing/
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Batch AI Scoring  │  Gửi batch 20 URLs/lần
   │                    │  kèm Issue A context
   │                    │  Retry on failure (max 3)
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Ranking & Limit   │  Sắp xếp theo relevance DESC
   │                    │  Giữ top 15-20 URLs
   │                    │  Group theo category
   └──────────────────┘
```

### Output

```typescript
interface FilterResult {
  issueDescription: string;
  totalScanned: number;
  preFiltered: number;    // Số URLs bị loại bởi regex
  aiScored: number;       // Số URLs được AI đánh giá
  results: ScoredUrl[];   // Sorted by relevance
  provider: string;       // AI provider đã dùng
  duration: number;
}
```

---

## 6. Export Module

### Copy to Clipboard Format

```markdown
# Documentation Analysis: [Issue title]

## Context
Vấn đề: [Mô tả Issue A]
Nguồn: [URL gốc]
Ngày phân tích: [timestamp]

## Recommended Documents (sorted by relevance)

### Tutorials (Hướng dẫn thực hành)
1. [Title](URL) ⭐ 9/10
   → Reason
2. ...

### Concepts (Khái niệm nền tảng)
1. [Title](URL) ⭐ 8/10
   → Reason
2. ...

### References (Tham chiếu API)
1. ...

### Examples (Ví dụ mã nguồn)
1. ...

## Summary
- Tổng URLs quét: X
- URLs liên quan: Y  
- Top categories: Tutorials (n), Concepts (n), References (n)
```

---

## 7. UI Design

### 3 Screens trong Popup (400x600px)

#### Screen 1: Input
- Text field: URL gốc (placeholder: "https://docs.example.com/")
- Textarea: Mô tả vấn đề / Issue A
- Button: "🔍 Analyze"
- Link: "⚙️ Settings"

#### Screen 2: Progress
- Step indicator: Crawling → Filtering → Done
- Progress bar với status text
- Số URLs đã tìm thấy (realtime update)
- Button: "Cancel"

#### Screen 3: Results
- Summary bar (total scanned, relevant found)
- Grouped list by category, mỗi URL có:
  - Checkbox (để user bỏ/thêm)
  - Title + URL
  - Relevance score (stars/badge)
  - Category badge
  - Reason (collapsible)
- Button: "📋 Copy to Clipboard"
- Button: "🔄 Re-analyze"

### Settings Page (Options page riêng)
- AI Provider dropdown (OpenAI / Anthropic / Gemini / DeepSeek / Ollama)
- API Key input (masked)
- Model selector (dynamic based on provider)
- Ollama endpoint URL (default: http://localhost:11434)
- Max URLs limit (slider: 50-200, default: 200)
- Max results limit (slider: 10-30, default: 15)

---

## 8. Tech Stack

| Component           | Technology                     |
|---------------------|--------------------------------|
| Extension Framework | Chrome Manifest V3             |
| UI Framework        | React 18 + TypeScript          |
| Styling             | TailwindCSS                    |
| Build Tool          | Vite + CRXJS plugin            |
| State Management    | Zustand (lightweight)          |
| HTTP Client         | fetch API (native)             |
| XML Parsing         | fast-xml-parser                |
| HTML Parsing        | DOMParser (native) + Readability |
| Storage             | chrome.storage.local           |
| Testing             | Vitest                         |

---

## 9. Project Structure

```
smart-doc-gatekeeper/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── src/
│   ├── popup/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── InputScreen.tsx
│   │   │   ├── ProgressScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   └── UrlItem.tsx
│   │   └── store/
│   │       └── appStore.ts
│   ├── options/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── components/
│   │       └── SettingsForm.tsx
│   ├── background/
│   │   ├── index.ts
│   │   └── messageHandler.ts
│   ├── modules/
│   │   ├── crawler/
│   │   │   ├── index.ts
│   │   │   ├── sitemapCrawler.ts
│   │   │   ├── domCrawler.ts
│   │   │   └── urlUtils.ts
│   │   ├── filter/
│   │   │   ├── index.ts
│   │   │   ├── preFilter.ts
│   │   │   └── aiScorer.ts
│   │   ├── export/
│   │   │   ├── index.ts
│   │   │   └── markdownFormatter.ts
│   │   └── ai/
│   │       ├── adapter.ts          # Interface
│   │       ├── openaiAdapter.ts
│   │       ├── anthropicAdapter.ts
│   │       ├── geminiAdapter.ts
│   │       ├── deepseekAdapter.ts
│   │       └── ollamaAdapter.ts
│   ├── shared/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── storage.ts
│   └── content/
│       └── index.ts               # Optional content script
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
└── tests/
    ├── crawler.test.ts
    ├── filter.test.ts
    └── aiAdapter.test.ts
```

---

## 10. Future Enhancements (Post-MVP)

- **F3: Template Management** — Lưu và tái sử dụng prompt mẫu
- **F5: Planning Mode** — AI đặt câu hỏi ngược, phân tích gap, gợi ý nguồn bổ sung
- **Content extraction** — Crawl full nội dung trang để AI phân tích sâu hơn
- **History** — Lưu lịch sử phân tích để so sánh
- **Batch analysis** — Phân tích nhiều documentation sites cùng lúc
- **NotebookLM direct integration** — Khi NotebookLM có API
