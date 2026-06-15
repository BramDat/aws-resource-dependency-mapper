import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { DependencyNode } from '../../../shared/types';

interface DependencyTreeProps {
  node: DependencyNode;
  depth?: number;
}

export function DependencyTree({ node, depth = 0 }: DependencyTreeProps): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(node.children?.length);

  return (
    <div className="tree-node" style={{ marginLeft: depth ? 22 : 0 }}>
      <div className="tree-row">
        <button className="expand-button" onClick={() => setExpanded((x) => !x)} disabled={!hasChildren}>
          {hasChildren ? expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} /> : <span />}
        </button>
        <span className={`node-badge node-${normalizeType(node.type)}`}>{node.type}</span>
        <div className="node-content">
          <strong>{node.label}</strong>
          {node.arn && <code>{node.arn}</code>}
        </div>
      </div>

      {node.metadata && Object.keys(node.metadata).length > 0 && (
        <details className="metadata">
          <summary>Metadata</summary>
          <pre>{JSON.stringify(node.metadata, null, 2)}</pre>
        </details>
      )}

      {expanded && hasChildren && (
        <div className="tree-children">
          {node.children?.map((child) => (
            <DependencyTree key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeType(type: string): string {
  return type.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
