import type { DependencyNode } from '../../shared/types';
import { runAwsJson } from '../services/command-runner';
import { getBucketNameFromArn } from './arn-utils';
import { node } from './node-factory';

export async function discoverS3(arnOrName: string): Promise<DependencyNode> {
  const bucketName = getBucketNameFromArn(arnOrName);
  const children: DependencyNode[] = [];
  const warnings: string[] = [];

  try {
    const location = await runAwsJson<{ LocationConstraint?: string }>([
      's3api',
      'get-bucket-location',
      '--bucket',
      bucketName
    ]);
    children.push(node('region', location.LocationConstraint || 'us-east-1'));
  } catch (error) {
    warnings.push(`Unable to read bucket location: ${toErrorMessage(error)}`);
  }

  try {
    const notification = await runAwsJson<Record<string, unknown>>([
      's3api',
      'get-bucket-notification-configuration',
      '--bucket',
      bucketName
    ]);
    children.push(node('notifications', 'Bucket Notifications', { metadata: notification }));
  } catch (error) {
    warnings.push(`Unable to read bucket notifications: ${toErrorMessage(error)}`);
  }

  try {
    const encryption = await runAwsJson<Record<string, unknown>>([
      's3api',
      'get-bucket-encryption',
      '--bucket',
      bucketName
    ]);
    children.push(node('encryption', 'Bucket Encryption', { metadata: encryption }));
  } catch {
    // Many buckets do not expose this to the caller; not necessarily an error worth surfacing.
  }

  return node('s3', bucketName, {
    arn: arnOrName.startsWith('arn:') ? arnOrName : `arn:aws:s3:::${bucketName}`,
    children,
    warnings
  });
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
