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
declare global {
  interface Window {
    historySpike?: SpikeBridge;
    services: { readText(path: string): Promise<string> };
  }
}
