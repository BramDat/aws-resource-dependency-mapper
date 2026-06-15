export const APP_NAME = 'AWS Resource Dependency Mapper';
export const DEFAULT_REGION = 'us-east-1';

export const SERVICE_OPTIONS = [
  { value: 'step-function', label: 'Step Function' },
  { value: 'lambda', label: 'Lambda' },
  { value: 's3', label: 'S3' }
] as const;
