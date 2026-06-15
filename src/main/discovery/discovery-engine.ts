import type { DependencyNode, DiscoveryRequest, DiscoveryResult } from '../../shared/types';
import { discoverLambda } from './lambda.discovery';
import { discoverS3 } from './s3.discovery';
import { discoverStepFunction } from './step-function.discovery';

export async function discoverDependencies(request: DiscoveryRequest): Promise<DiscoveryResult> {
  validateRequest(request);

  let root: DependencyNode;
  switch (request.serviceType) {
    case 'step-function':
      root = await discoverStepFunction(request.arn);
      break;
    case 'lambda':
      root = await discoverLambda(request.arn);
      break;
    case 's3':
      root = await discoverS3(request.arn);
      break;
    default:
      throw new Error(`Unsupported service type: ${request.serviceType}`);
  }

  return {
    root,
    discoveredAt: new Date().toISOString(),
    sourceArn: request.arn,
    serviceType: request.serviceType,
    warnings: collectWarnings(root)
  };
}

function validateRequest(request: DiscoveryRequest): void {
  if (!request.arn?.trim()) throw new Error('ARN is required.');
  if (!request.serviceType) throw new Error('Service type is required.');
}

function collectWarnings(node: DependencyNode): string[] {
  const warnings = [...(node.warnings ?? [])];
  for (const child of node.children ?? []) warnings.push(...collectWarnings(child));
  return warnings;
}
