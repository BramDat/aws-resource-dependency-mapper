import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, FileJson, ImageDown, Loader2, Play, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { AwsAuthStatus, AwsCliStatus, AwsServiceType, DependencyNode, DiscoveryResult, RecentScan } from '../../../shared/types';
import { SERVICE_OPTIONS } from '../../../shared/constants';
import { DependencyTree } from './DependencyTree';
import { StatusPill } from './StatusPill';

const docsUrl = 'https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html';

export function App(): JSX.Element {
  const [cliStatus, setCliStatus] = useState<AwsCliStatus | null>(null);
  const [authStatus, setAuthStatus] = useState<AwsAuthStatus | null>(null);
  const [serviceType, setServiceType] = useState<AwsServiceType>('step-function');
  const [arn, setArn] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshStatus();
    void loadRecentScans();
  }, []);

  const canDiscover = useMemo(
    () => Boolean(cliStatus?.installed && authStatus?.authenticated && arn.trim() && !isDiscovering),
    [authStatus?.authenticated, arn, cliStatus?.installed, isDiscovering]
  );

  async function refreshStatus(): Promise<void> {
    setIsChecking(true);
    setError(null);
    try {
      const [cli, auth] = await Promise.all([
        window.awsDependencyMapper.checkAwsCli(),
        window.awsDependencyMapper.checkAwsAuth()
      ]);
      setCliStatus(cli);
      setAuthStatus(auth);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsChecking(false);
    }
  }

  async function loadRecentScans(): Promise<void> {
    setRecentScans(await window.awsDependencyMapper.listRecentScans());
  }

  async function discover(): Promise<void> {
    if (!canDiscover) return;
    setIsDiscovering(true);
    setError(null);
    setResult(null);

    try {
      const discoveryResult = await window.awsDependencyMapper.runDiscovery({ serviceType, arn: arn.trim() });
      setResult(discoveryResult);
      const recent = await window.awsDependencyMapper.addRecentScan({
        id: crypto.randomUUID(),
        serviceType,
        arn: arn.trim(),
        label: discoveryResult.root.label,
        scannedAt: new Date().toISOString()
      });
      setRecentScans(recent);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsDiscovering(false);
    }
  }

  async function exportJson(): Promise<void> {
    if (!result) return;
    await window.awsDependencyMapper.exportJson(result);
  }

  async function exportPng(): Promise<void> {
    if (!treeRef.current) return;
    const dataUrl = await toPng(treeRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#07111f'
    });
    await window.awsDependencyMapper.exportPng(dataUrl);
  }

  function useRecentScan(scan: RecentScan): void {
    setServiceType(scan.serviceType);
    setArn(scan.arn);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="brand-row">
          <div className="logo-mark">ADM</div>
          <div>
            <h1>AWS Resource Dependency Mapper</h1>
            <p>Start with any AWS ARN. Discover everything connected to it.</p>
          </div>
        </div>

        <div className="status-grid">
          <StatusPill
            label="AWS CLI"
            status={isChecking ? 'checking' : cliStatus?.installed ? 'success' : 'danger'}
            detail={cliStatus?.installed ? cliStatus.version ?? 'Installed' : 'Not installed'}
          />
          <StatusPill
            label="AWS Login"
            status={isChecking ? 'checking' : authStatus?.authenticated ? 'success' : 'danger'}
            detail={authStatus?.authenticated ? `Account ${authStatus.identity?.account}` : 'Not configured'}
          />
          <StatusPill
            label="Region"
            status={authStatus?.identity?.region ? 'success' : 'neutral'}
            detail={authStatus?.identity?.region ?? 'Default/unknown'}
          />
        </div>

        <div className="action-row">
          <button className="secondary-button" onClick={refreshStatus} disabled={isChecking}>
            {isChecking ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
            Refresh AWS status
          </button>
          {!cliStatus?.installed && (
            <button className="link-button" onClick={() => window.awsDependencyMapper.openExternal(docsUrl)}>
              Install AWS CLI
            </button>
          )}
        </div>
      </section>

      <section className="content-grid">
        <aside className="side-card">
          <h2>Discovery</h2>
          <label>
            Service
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value as AwsServiceType)}>
              {SERVICE_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Resource ARN
            <textarea
              value={arn}
              onChange={(e) => setArn(e.target.value)}
              placeholder="arn:aws:lambda:us-east-1:123456789012:function:process-orders"
              rows={5}
            />
          </label>

          <button className="primary-button" disabled={!canDiscover} onClick={discover}>
            {isDiscovering ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
            {isDiscovering ? 'Discovering...' : 'Start Discovery'}
          </button>

          {error && (
            <div className="error-box">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="recent-block">
            <h3>Recent scans</h3>
            {recentScans.length === 0 && <p className="muted">No recent scans yet.</p>}
            {recentScans.map((scan) => (
              <button key={scan.id} className="recent-item" onClick={() => useRecentScan(scan)}>
                <span>{scan.label}</span>
                <small>{scan.serviceType}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="result-card">
          <div className="result-header">
            <div>
              <h2>Dependency tree</h2>
              <p>{result ? `Generated ${new Date(result.discoveredAt).toLocaleString()}` : 'Run discovery to see related AWS resources.'}</p>
            </div>
            <div className="export-row">
              <button className="secondary-button" disabled={!result} onClick={exportJson}>
                <FileJson size={16} /> JSON
              </button>
              <button className="secondary-button" disabled={!result} onClick={exportPng}>
                <ImageDown size={16} /> PNG
              </button>
            </div>
          </div>

          <div className="tree-canvas" ref={treeRef}>
            {result ? <DependencyTree node={result.root} /> : <EmptyTree />}
          </div>

          {result?.warnings?.length ? (
            <div className="warnings">
              <h3>Warnings</h3>
              {result.warnings.map((warning, index) => (
                <p key={`${warning}-${index}`}>{warning}</p>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function EmptyTree(): JSX.Element {
  return (
    <div className="empty-tree">
      <Download size={42} />
      <h3>No tree generated yet</h3>
      <p>Select a service, paste an ARN, and start discovery.</p>
    </div>
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
