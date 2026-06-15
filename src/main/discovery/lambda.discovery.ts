import type { DependencyNode } from '../../shared/types';
import { runAwsJson } from '../services/command-runner';
import { getLambdaFunctionNameFromArn } from './arn-utils';
import { node } from './node-factory';

interface LambdaFunctionConfiguration {
  FunctionName: string;
  FunctionArn: string;
  Runtime?: string;
  Role?: string;
  Handler?: string;
  VpcConfig?: { VpcId?: string; SubnetIds?: string[]; SecurityGroupIds?: string[] };
  Environment?: { Variables?: Record<string, string> };
  Layers?: { Arn: string; CodeSize?: number }[];
}

interface LambdaFunctionResponse {
  Configuration: LambdaFunctionConfiguration;
}

interface EventSourceMappingsResponse {
  EventSourceMappings?: Array<{
    UUID: string;
    EventSourceArn?: string;
    State?: string;
  }>;
}

export async function discoverLambda(arnOrName: string): Promise<DependencyNode> {
  const functionName = getLambdaFunctionNameFromArn(arnOrName);
  const warnings: string[] = [];

  const response = await runAwsJson<LambdaFunctionResponse>([
    'lambda',
    'get-function',
    '--function-name',
    functionName
  ]);

  const config = response.Configuration;
  const children: DependencyNode[] = [];

  if (config.Role) {
    children.push(node('iam-role', roleName(config.Role), { arn: config.Role }));
  }

  children.push(
    node('cloudwatch-log-group', `/aws/lambda/${config.FunctionName}`, {
      metadata: { inferred: true }
    })
  );

  if (config.VpcConfig?.VpcId) {
    children.push(
      node('vpc', config.VpcConfig.VpcId, {
        metadata: {
          subnetIds: config.VpcConfig.SubnetIds ?? [],
          securityGroupIds: config.VpcConfig.SecurityGroupIds ?? []
        }
      })
    );
  }

  for (const layer of config.Layers ?? []) {
    children.push(node('lambda-layer', layer.Arn.split(':').slice(-2).join(':'), { arn: layer.Arn }));
  }

  const envVars = Object.keys(config.Environment?.Variables ?? {});
  if (envVars.length > 0) {
    children.push(
      node('environment', 'Environment Variables', {
        metadata: {
          variableNames: envVars,
          note: 'Values are intentionally not displayed to avoid exposing secrets.'
        }
      })
    );
  }

  try {
    const mappings = await runAwsJson<EventSourceMappingsResponse>([
      'lambda',
      'list-event-source-mappings',
      '--function-name',
      functionName
    ]);

    for (const mapping of mappings.EventSourceMappings ?? []) {
      children.push(
        node('event-source', mapping.EventSourceArn ?? mapping.UUID, {
          arn: mapping.EventSourceArn,
          metadata: { state: mapping.State, uuid: mapping.UUID }
        })
      );
    }
  } catch (error) {
    warnings.push(`Unable to read Lambda event source mappings: ${toErrorMessage(error)}`);
  }

  const reverseStateMachines = await findReferencingStateMachines(config.FunctionArn, warnings);
  if (reverseStateMachines.length > 0) {
    children.push(
      node('step-functions-references', 'Step Functions referencing this Lambda', {
        children: reverseStateMachines
      })
    );
  }

  return node('lambda', config.FunctionName, {
    arn: config.FunctionArn,
    metadata: {
      runtime: config.Runtime,
      handler: config.Handler
    },
    children,
    warnings
  });
}

async function findReferencingStateMachines(
  lambdaArn: string,
  warnings: string[]
): Promise<DependencyNode[]> {
  try {
    const list = await runAwsJson<{ stateMachines?: Array<{ name: string; stateMachineArn: string }> }>([
      'stepfunctions',
      'list-state-machines'
    ]);

    const matches: DependencyNode[] = [];
    const lambdaName = getLambdaFunctionNameFromArn(lambdaArn);

    for (const sm of list.stateMachines ?? []) {
      try {
        const detail = await runAwsJson<{ definition: string }>([
          'stepfunctions',
          'describe-state-machine',
          '--state-machine-arn',
          sm.stateMachineArn
        ]);
        if (detail.definition.includes(lambdaArn) || detail.definition.includes(lambdaName)) {
          matches.push(node('step-function', sm.name, { arn: sm.stateMachineArn }));
        }
      } catch {
        // Keep scanning other state machines.
      }
    }

    return matches;
  } catch (error) {
    warnings.push(`Unable to scan Step Functions for reverse Lambda references: ${toErrorMessage(error)}`);
    return [];
  }
}

function roleName(roleArn: string): string {
  return roleArn.split('/').pop() ?? roleArn;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
