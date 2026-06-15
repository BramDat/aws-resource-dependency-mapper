import type { DependencyNode } from '../../shared/types';
import { runAwsJson } from '../services/command-runner';
import { getStateMachineNameFromArn } from './arn-utils';
import { discoverLambda } from './lambda.discovery';
import { node } from './node-factory';

interface StateMachineResponse {
  stateMachineArn: string;
  name: string;
  roleArn?: string;
  definition: string;
  loggingConfiguration?: {
    destinations?: Array<{ cloudWatchLogsLogGroup?: { logGroupArn?: string } }>;
  };
}

export async function discoverStepFunction(arn: string): Promise<DependencyNode> {
  const warnings: string[] = [];
  const response = await runAwsJson<StateMachineResponse>([
    'stepfunctions',
    'describe-state-machine',
    '--state-machine-arn',
    arn
  ]);

  const children: DependencyNode[] = [];

  if (response.roleArn) {
    children.push(node('iam-role', response.roleArn.split('/').pop() ?? response.roleArn, { arn: response.roleArn }));
  }

  for (const destination of response.loggingConfiguration?.destinations ?? []) {
    const logArn = destination.cloudWatchLogsLogGroup?.logGroupArn;
    if (logArn) children.push(node('cloudwatch-log-group', logArn.split(':').pop() ?? logArn, { arn: logArn }));
  }

  const integrationArns = extractAwsArns(response.definition);
  const lambdaArns = integrationArns.filter((x) => x.includes(':lambda:') && x.includes(':function:'));
  const s3Arns = integrationArns.filter((x) => x.includes(':s3:::'));

  for (const lambdaArn of unique(lambdaArns)) {
    try {
      children.push(await discoverLambda(lambdaArn));
    } catch (error) {
      warnings.push(`Unable to discover Lambda ${lambdaArn}: ${toErrorMessage(error)}`);
      children.push(node('lambda', lambdaArn.split(':').pop() ?? lambdaArn, { arn: lambdaArn, warnings: [toErrorMessage(error)] }));
    }
  }

  for (const s3Arn of unique(s3Arns)) {
    children.push(node('s3', s3Arn.replace('arn:aws:s3:::', ''), { arn: s3Arn }));
  }

  const awsSdkIntegrations = extractSdkIntegrations(response.definition);
  if (awsSdkIntegrations.length > 0) {
    children.push(
      node('aws-sdk-integrations', 'AWS SDK integrations found in definition', {
        metadata: { integrations: awsSdkIntegrations }
      })
    );
  }

  return node('step-function', response.name || getStateMachineNameFromArn(arn), {
    arn: response.stateMachineArn,
    children,
    warnings,
    metadata: {
      definitionStates: countStates(response.definition)
    }
  });
}

function extractAwsArns(text: string): string[] {
  const matches = text.match(/arn:aws[a-zA-Z-]*:[^"\\\s]+/g) ?? [];
  return matches.map((x) => x.replace(/[",}]+$/, ''));
}

function extractSdkIntegrations(definition: string): string[] {
  const matches = definition.match(/arn:aws:states:::[a-zA-Z0-9_.:-]+/g) ?? [];
  return unique(matches);
}

function countStates(definition: string): number | undefined {
  try {
    const parsed = JSON.parse(definition) as { States?: Record<string, unknown> };
    return Object.keys(parsed.States ?? {}).length;
  } catch {
    return undefined;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
