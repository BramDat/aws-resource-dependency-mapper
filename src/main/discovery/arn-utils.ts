export interface ParsedArn {
  partition: string;
  service: string;
  region: string;
  accountId: string;
  resource: string;
}

export function parseArn(arn: string): ParsedArn {
  const parts = arn.split(':');
  if (parts.length < 6 || parts[0] !== 'arn') {
    throw new Error('Invalid ARN format. Expected arn:partition:service:region:account-id:resource.');
  }

  return {
    partition: parts[1],
    service: parts[2],
    region: parts[3],
    accountId: parts[4],
    resource: parts.slice(5).join(':')
  };
}

export function getLambdaFunctionNameFromArn(arnOrName: string): string {
  if (!arnOrName.startsWith('arn:')) return arnOrName;
  const parsed = parseArn(arnOrName);
  if (parsed.service !== 'lambda') return arnOrName;
  return parsed.resource.replace(/^function:/, '').split(':')[0];
}

export function getStateMachineNameFromArn(arn: string): string {
  const parsed = parseArn(arn);
  return parsed.resource.replace(/^stateMachine:/, '');
}

export function getBucketNameFromArn(arnOrName: string): string {
  if (!arnOrName.startsWith('arn:')) return arnOrName;
  const parsed = parseArn(arnOrName);
  if (parsed.service !== 's3') return arnOrName;
  return parsed.resource.split('/')[0];
}
