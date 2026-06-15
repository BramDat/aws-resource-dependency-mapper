import type { DependencyNode } from '../../shared/types';

export function node(
  type: string,
  label: string,
  options: Partial<Omit<DependencyNode, 'id' | 'type' | 'label'>> = {}
): DependencyNode {
  const idBase = `${type}:${options.arn ?? label}`;
  return {
    id: idBase,
    type,
    label,
    ...options
  };
}
