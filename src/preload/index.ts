import { contextBridge, ipcRenderer } from 'electron';
import type { AppUpdateCheckResult, AppUpdateStatus, DiscoveryRequest, DiscoveryResult, RecentScan } from '../shared/types';

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
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('app:open-external', url),
  getUpdateStatus: (): Promise<AppUpdateStatus> => ipcRenderer.invoke('updater:status'),
  checkForUpdates: (): Promise<AppUpdateCheckResult> => ipcRenderer.invoke('updater:check'),
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('updater:download'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('updater:install'),
  onUpdateStatus: (callback: (status: AppUpdateStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: AppUpdateStatus): void => callback(status);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  }
};

contextBridge.exposeInMainWorld('awsDependencyMapper', api);

export type AwsDependencyMapperApi = typeof api;
