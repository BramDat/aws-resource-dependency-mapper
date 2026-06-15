import { contextBridge, ipcRenderer } from 'electron';
import type { DiscoveryRequest, DiscoveryResult, RecentScan } from '../shared/types';

const api = {
  checkAwsCli: () => ipcRenderer.invoke('aws:check-cli'),
  checkAwsAuth: () => ipcRenderer.invoke('aws:check-auth'),
  runDiscovery: (request: DiscoveryRequest): Promise<DiscoveryResult> =>
    ipcRenderer.invoke('discovery:run', request),
  exportJson: (payload: unknown): Promise<{ saved: boolean; filePath?: string }> =>
    ipcRenderer.invoke('export:json', payload),
  exportPng: (dataUrl: string): Promise<{ saved: boolean; filePath?: string }> =>
    ipcRenderer.invoke('export:png', dataUrl),
  listRecentScans: (): Promise<RecentScan[]> => ipcRenderer.invoke('recent:list'),
  addRecentScan: (scan: RecentScan): Promise<RecentScan[]> => ipcRenderer.invoke('recent:add', scan),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('app:open-external', url)
};

contextBridge.exposeInMainWorld('awsDependencyMapper', api);

export type AwsDependencyMapperApi = typeof api;
