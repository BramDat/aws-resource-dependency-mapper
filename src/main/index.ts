import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { checkAwsAuth } from './services/aws-auth.service';
import { checkAwsCli } from './services/aws-cli.service';
import { discoverDependencies } from './discovery/discovery-engine';
import type { DiscoveryRequest, RecentScan } from '../shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: 'AWS Resource Dependency Mapper',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerIpcHandlers(): void {
  ipcMain.handle('aws:check-cli', () => checkAwsCli());
  ipcMain.handle('aws:check-auth', () => checkAwsAuth());
  ipcMain.handle('discovery:run', async (_event, request: DiscoveryRequest) => discoverDependencies(request));
  ipcMain.handle('app:open-external', (_event, url: string) => shell.openExternal(url));
  ipcMain.handle('recent:list', () => readRecentScans());
  ipcMain.handle('recent:add', (_event, scan: RecentScan) => addRecentScan(scan));
  ipcMain.handle('export:json', async (_event, payload: unknown) => exportJson(payload));
  ipcMain.handle('export:png', async (_event, dataUrl: string) => exportPng(dataUrl));
}

async function exportJson(payload: unknown): Promise<{ saved: boolean; filePath?: string }> {
  const result = await dialog.showSaveDialog({
    title: 'Export dependency tree as JSON',
    defaultPath: 'aws-dependency-tree.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (result.canceled || !result.filePath) return { saved: false };
  await fs.writeFile(result.filePath, JSON.stringify(payload, null, 2), 'utf8');
  return { saved: true, filePath: result.filePath };
}

async function exportPng(dataUrl: string): Promise<{ saved: boolean; filePath?: string }> {
  const result = await dialog.showSaveDialog({
    title: 'Export dependency tree as PNG',
    defaultPath: 'aws-dependency-tree.png',
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  });

  if (result.canceled || !result.filePath) return { saved: false };
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  await fs.writeFile(result.filePath, Buffer.from(base64, 'base64'));
  return { saved: true, filePath: result.filePath };
}

async function readRecentScans(): Promise<RecentScan[]> {
  try {
    const content = await fs.readFile(getRecentScansPath(), 'utf8');
    return JSON.parse(content) as RecentScan[];
  } catch {
    return [];
  }
}

async function addRecentScan(scan: RecentScan): Promise<RecentScan[]> {
  const existing = await readRecentScans();
  const deduped = existing.filter((x) => x.arn !== scan.arn || x.serviceType !== scan.serviceType);
  const next = [scan, ...deduped].slice(0, 10);
  await fs.mkdir(path.dirname(getRecentScansPath()), { recursive: true });
  await fs.writeFile(getRecentScansPath(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function getRecentScansPath(): string {
  return path.join(app.getPath('userData'), 'recent-scans.json');
}
