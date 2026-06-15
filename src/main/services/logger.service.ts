import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

type LogLevel = 'info' | 'warn' | 'error';

export function logInfo(message: string, details?: unknown): void {
  writeLog('info', message, details);
}

export function logWarn(message: string, details?: unknown): void {
  writeLog('warn', message, details);
}

export function logError(message: string, details?: unknown): void {
  writeLog('error', message, details);
}

export function getLogFilePath(): string {
  const logsDirectory = app.isReady()
    ? path.join(app.getPath('userData'), 'logs')
    : path.join(process.cwd(), 'logs');

  return path.join(logsDirectory, 'app.log');
}

function writeLog(level: LogLevel, message: string, details?: unknown): void {
  const timestamp = new Date().toISOString();
  const formattedDetails = formatDetails(details);
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedDetails}\n`;

  writeToConsole(level, message, details);

  try {
    const logFilePath = getLogFilePath();
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    fs.appendFileSync(logFilePath, line, 'utf8');
  } catch (error) {
    console.error('Failed to write application log.', error);
  }
}

function writeToConsole(level: LogLevel, message: string, details?: unknown): void {
  if (level === 'error') {
    console.error(message, details ?? '');
    return;
  }

  if (level === 'warn') {
    console.warn(message, details ?? '');
    return;
  }

  console.info(message, details ?? '');
}

function formatDetails(details?: unknown): string {
  if (details === undefined || details === null) return '';

  if (details instanceof Error) {
    return ` | ${details.stack || details.message}`;
  }

  if (typeof details === 'string') {
    return ` | ${details}`;
  }

  try {
    return ` | ${JSON.stringify(details)}`;
  } catch {
    return ` | ${String(details)}`;
  }
}
