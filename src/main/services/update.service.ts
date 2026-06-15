import { app, BrowserWindow } from 'electron';
import { createRequire } from 'node:module';
import type { ProgressInfo, UpdateInfo } from 'electron-updater';
import { logError, logInfo } from './logger.service';
import type { AppUpdateCheckResult, AppUpdateStatus } from '../../shared/types';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater') as typeof import('electron-updater');

type StatusListener = (status: AppUpdateStatus) => void;

let latestStatus: AppUpdateStatus = {
  status: 'idle',
  message: 'Check for updates',
  currentVersion: app.getVersion()
};

let updateReadyToDownload = false;

export function initializeUpdater(mainWindowProvider: () => BrowserWindow | null): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  logInfo('Updater initialized', {
    currentVersion: app.getVersion(),
    isPackaged: app.isPackaged
  });

  const publishStatus: StatusListener = (status) => {
    latestStatus = status;
    logInfo(`Updater status changed: ${status.status}`, status);
    mainWindowProvider()?.webContents.send('updater:status', latestStatus);
  };

  autoUpdater.on('checking-for-update', () => {
    updateReadyToDownload = false;
    publishStatus({
      status: 'checking',
      message: 'Checking for updates...',
      currentVersion: app.getVersion()
    });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    updateReadyToDownload = true;
    publishStatus({
      status: 'available',
      message: `Update available: v${info.version}`,
      currentVersion: app.getVersion(),
      availableVersion: info.version
    });
  });

  autoUpdater.on('update-not-available', () => {
    updateReadyToDownload = false;
    publishStatus({
      status: 'not-available',
      message: 'You are already using the latest version.',
      currentVersion: app.getVersion()
    });
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    publishStatus({
      status: 'downloading',
      message: `Downloading update: ${Math.round(progress.percent)}%`,
      currentVersion: app.getVersion(),
      percent: progress.percent
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    updateReadyToDownload = false;
    publishStatus({
      status: 'downloaded',
      message: 'Update downloaded. Restart to install.',
      currentVersion: app.getVersion(),
      availableVersion: info.version
    });
  });

  autoUpdater.on('error', (error: Error) => {
    logError('Updater error', error);
    publishStatus({
      status: 'error',
      message: error.message || 'Update check failed.',
      currentVersion: app.getVersion()
    });
  });
}

export function getUpdateStatus(): AppUpdateStatus {
  return latestStatus;
}

export async function checkForUpdates(): Promise<AppUpdateCheckResult> {
  if (!app.isPackaged) {
    latestStatus = {
      status: 'skipped',
      message: 'Update checks are only available in the installed Windows app.',
      currentVersion: app.getVersion()
    };
    logInfo('Skipped update check because the app is running in development mode.');
    return {
      updateAvailable: false,
      message: latestStatus.message
    };
  }

  logInfo('Checking for updates from configured publisher.');
  const result = await autoUpdater.checkForUpdates();
  const info = result?.updateInfo;
  return {
    updateAvailable: updateReadyToDownload,
    version: info?.version,
    message: updateReadyToDownload && info?.version
      ? `Update available: v${info.version}`
      : latestStatus.message
  };
}

export async function downloadUpdate(): Promise<void> {
  if (!app.isPackaged) {
    logInfo('Skipped update download because the app is running in development mode.');
    return;
  }

  logInfo('Downloading update.');
  await autoUpdater.downloadUpdate();
}

export function installUpdate(): void {
  if (!app.isPackaged) {
    logInfo('Skipped update install because the app is running in development mode.');
    return;
  }

  logInfo('Restarting app to install downloaded update.');
  autoUpdater.quitAndInstall();
}
