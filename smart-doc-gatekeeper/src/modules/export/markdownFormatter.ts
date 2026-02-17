import type { FilterResult, ScoredUrl, UrlCategory } from '@/shared/types';

const CATEGORY_LABELS: Record<UrlCategory, string> = {
  tutorial: 'Tutorials (Hướng dẫn thực hành)',
  concept: 'Concepts (Khái niệm nền tảng)',
  reference: 'References (Tham chiếu API)',
  example: 'Examples (Ví dụ mã nguồn)',
};

const CATEGORY_ORDER: UrlCategory[] = ['tutorial', 'concept', 'reference', 'example'];

export function formatAsMarkdown(result: FilterResult, baseUrl: string): string {
  const lines: string[] = [];

  lines.push(`# Documentation Analysis`);
  lines.push('');
  lines.push(`## Context`);
  lines.push(`- **Vấn đề:** ${result.issueDescription}`);
  lines.push(`- **Nguồn:** ${baseUrl}`);
  lines.push(`- **Ngày phân tích:** ${new Date().toLocaleString('vi-VN')}`);
  lines.push(`- **AI Provider:** ${result.provider}`);
  lines.push('');
  lines.push(`## Recommended Documents`);
  lines.push('');

  // Group by category
  const grouped = new Map<UrlCategory, ScoredUrl[]>();
  for (const url of result.results) {
    const list = grouped.get(url.category) || [];
    list.push(url);
    grouped.set(url.category, list);
  }

  for (const category of CATEGORY_ORDER) {
    const urls = grouped.get(category);
    if (!urls || urls.length === 0) continue;

    lines.push(`### ${CATEGORY_LABELS[category]}`);
    urls.forEach((url, idx) => {
      lines.push(`${idx + 1}. [${url.title || url.url}](${url.url}) ⭐ ${url.relevance}/10`);
      lines.push(`   → ${url.reason}`);
    });
    lines.push('');
  }

  lines.push(`## Summary`);
  lines.push(`- Tổng URLs quét: ${result.totalScanned}`);
  lines.push(`- URLs bị loại (pre-filter): ${result.preFiltered}`);
  lines.push(`- URLs được AI đánh giá: ${result.aiScored}`);
  lines.push(`- URLs liên quan: ${result.results.length}`);

  const categoryCounts = CATEGORY_ORDER
    .map(c => {
      const count = grouped.get(c)?.length || 0;
      return count > 0 ? `${CATEGORY_LABELS[c].split(' ')[0]} (${count})` : null;
    })
    .filter(Boolean)
    .join(', ');
  
  if (categoryCounts) {
    lines.push(`- Phân loại: ${categoryCounts}`);
  }

  lines.push(`- Thời gian xử lý: ${(result.duration / 1000).toFixed(1)}s`);

  return lines.join('\n');
}
