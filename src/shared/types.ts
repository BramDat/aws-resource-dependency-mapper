export type AwsServiceType = 'step-function' | 'lambda' | 's3';

export interface AwsCliStatus {
  installed: boolean;
  version?: string;
  error?: string;
}

export interface AwsIdentity {
  account: string;
  arn: string;
  userId: string;
  region?: string;
}

export interface AwsAuthStatus {
  authenticated: boolean;
  identity?: AwsIdentity;
  error?: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: string;
  arn?: string;
  metadata?: Record<string, unknown>;
  children?: DependencyNode[];
  warnings?: string[];
}

export interface DiscoveryRequest {
  serviceType: AwsServiceType;
  arn: string;
}

export interface DiscoveryResult {
  root: DependencyNode;
  discoveredAt: string;
  sourceArn: string;
  serviceType: AwsServiceType;
  warnings: string[];
}

export interface RecentScan {
  id: string;
  serviceType: AwsServiceType;
  arn: string;
  label: string;
  scannedAt: string;
}

export type UpdateStatusType =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'skipped';

export interface AppUpdateStatus {
  status: UpdateStatusType;
  message: string;
  currentVersion: string;
  availableVersion?: string;
  percent?: number;
}

export interface AppUpdateCheckResult {
  updateAvailable: boolean;
  version?: string;
  message: string;
}
