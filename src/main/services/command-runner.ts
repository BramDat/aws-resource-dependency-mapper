import { execFile } from 'node:child_process';

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export function runCommand(
  command: string,
  args: string[],
  options: { timeoutMs?: number } = {}
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        windowsHide: true,
        timeout: options.timeoutMs ?? 30_000,
        maxBuffer: 1024 * 1024 * 20
      },
      (error, stdout, stderr) => {
        if (error) {
          const err = new Error(stderr || error.message);
          reject(err);
          return;
        }

        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      }
    );
  });
}

export async function runAws(args: string[], timeoutMs = 45_000): Promise<CommandResult> {
  return runCommand('aws', args, { timeoutMs });
}

export async function runAwsJson<T>(args: string[], timeoutMs = 45_000): Promise<T> {
  const result = await runAws([...args, '--output', 'json'], timeoutMs);
  return JSON.parse(result.stdout) as T;
}
