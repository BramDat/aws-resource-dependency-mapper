#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: false
});

child.on('exit', (code) => process.exit(code ?? 0));
