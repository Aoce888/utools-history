export function dateRange(preset: string, start = '', end = '', now = new Date()): { from?: number; to?: number } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextDay = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
  if (preset === 'today') return { from: today.getTime(), to: nextDay(today, 1) };
  if (preset === 'yesterday') return { from: nextDay(today, -1), to: today.getTime() };
  if (preset === 'week') return { from: nextDay(today, -6), to: nextDay(today, 1) };
  if (preset === 'custom') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) throw Error('请选择完整日期范围');
    const parse = (value: string) => { const [y, m, d] = value.split('-').map(Number); const date = new Date(y, m - 1, d); if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) throw Error('日期无效'); return date; };
    const from = parse(start).getTime(), to = nextDay(parse(end), 1);
    if (from >= to) throw Error('结束日期不能早于开始日期');
    return { from, to };
  }
  return {};
}
export function duration(ms: number) {
  if (ms < 1000) return '< 1 秒';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
  return `${Math.floor(seconds / 3600)} 小时 ${Math.floor(seconds % 3600 / 60)} 分`;
}
export function dayLabel(timestamp: number) { return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }); }
export function timeLabel(timestamp: number) { return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  if (!query) return [{ text, match: false }];
  const lower = text.toLowerCase(), needle = query.toLowerCase();
  const result = []; let cursor = 0, index;
  while ((index = lower.indexOf(needle, cursor)) >= 0) {
    if (index > cursor) result.push({ text: text.slice(cursor, index), match: false });
    result.push({ text: text.slice(index, index + query.length), match: true }); cursor = index + query.length;
  }
  if (cursor < text.length) result.push({ text: text.slice(cursor), match: false });
  return result;
}
