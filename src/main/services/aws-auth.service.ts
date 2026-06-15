import type { AwsAuthStatus } from '../../shared/types';
import { runAws, runAwsJson } from './command-runner';

interface StsIdentityResponse {
  Account: string;
  Arn: string;
  UserId: string;
}

export async function getConfiguredRegion(): Promise<string | undefined> {
  try {
    const result = await runAws(['configure', 'get', 'region'], 10_000);
    return result.stdout || undefined;
  } catch {
    return undefined;
  }
}

export async function checkAwsAuth(): Promise<AwsAuthStatus> {
  try {
    const [identity, region] = await Promise.all([
      runAwsJson<StsIdentityResponse>(['sts', 'get-caller-identity'], 20_000),
      getConfiguredRegion()
    ]);

    return {
      authenticated: true,
      identity: {
        account: identity.Account,
        arn: identity.Arn,
        userId: identity.UserId,
        region
      }
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'AWS credentials are not configured.'
    };
  }
}
