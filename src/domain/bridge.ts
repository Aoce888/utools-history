export interface WindowSample {
  timestamp: number;
  appName: string;
  processId: number;
  windowTitle: string;
  status: string;
}
export interface SpikeSnapshot {
  state: 'not_started' | 'recording' | 'paused' | 'unavailable';
  message: string;
  samples: WindowSample[];
}
export interface SpikeBridge {
  snapshot(): SpikeSnapshot;
  start(): void;
  stop(): void;
  clear(): void;
}
export interface ActivityRecord {
  id: number; appId: string; appName: string; processName: string; windowTitle: string;
  startedAt: number; endedAt: number; durationMs: number;
}
export interface Settings {
  consent: boolean; paused: boolean; retentionDays: number; idleSeconds: number;
  excludedApps: string[]; theme: 'system' | 'light' | 'dark';
}
export interface SearchQuery { q?: string; from?: number; to?: number; appId?: string; limit?: number; cursor?: string }
export interface SearchPage { items: ActivityRecord[]; nextCursor?: string }
export interface AppSummary { appId: string; appName: string }
export interface AppStats extends AppSummary { durationMs: number }
export interface ServiceStatus {
  state: SpikeSnapshot['state']; message: string; revision: number; count: number;
  directory?: string; storageMode?: string;
}
export interface DeleteQuery { ids?: number[]; from?: number; to?: number; all?: boolean }
export type Reply<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string } };
export interface HistoryBridge {
  status(): Promise<Reply<ServiceStatus>>;
  start(): Promise<Reply<void>>;
  pause(): Promise<Reply<void>>;
  getSettings(): Promise<Reply<Settings>>;
  updateSettings(patch: Partial<Settings>): Promise<Reply<Settings>>;
  search(query: SearchQuery): Promise<Reply<SearchPage>>;
  stats(query: { from: number; to: number }): Promise<Reply<AppStats[]>>;
  apps(): Promise<Reply<AppSummary[]>>;
  deleteRecords(query: DeleteQuery): Promise<Reply<number>>;
  exportRecords(query: { format: 'csv' | 'json'; from?: number; to?: number }): Promise<Reply<string>>;
}
declare global {
  interface Window {
    historySpike?: SpikeBridge;
    historyBridge?: HistoryBridge;
    services: { readText(path: string): Promise<string> };
  }
}
