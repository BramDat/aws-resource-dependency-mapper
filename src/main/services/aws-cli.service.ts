import type { AwsCliStatus } from '../../shared/types';
import { runCommand } from './command-runner';

export async function checkAwsCli(): Promise<AwsCliStatus> {
  try {
    const result = await runCommand('aws', ['--version'], { timeoutMs: 10_000 });
    return {
      installed: true,
      version: result.stdout || result.stderr
    };
  } catch (error) {
    return {
      installed: false,
      error: error instanceof Error ? error.message : 'AWS CLI was not found.'
    };
  }
}
