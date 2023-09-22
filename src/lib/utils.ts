import type { TargetNode } from '@/lib/graph-db';

export class TwoWayMap extends Map<string, string> {
  constructor(list: [string, string][]) {
    const revList = list.map(([a, b]) => [b, a]) as [string, string][];
    super([...list, ...revList]);
  }
}

export const nodeSortFn = (a: Pick<TargetNode, 'edgeCreatedAt'>, b: Pick<TargetNode, 'edgeCreatedAt'>) => {
  return a.edgeCreatedAt - b.edgeCreatedAt;
};

export const generateUID = () => crypto.randomUUID().slice(0, 8);

export function getAgentSystem(){
  if(!('navigator' in window)){
    return 'unknown';
  }
  const platform = navigator.userAgent.toLowerCase();
  if(platform.includes('mac')) return 'macos';
  if(platform.includes('win')) return 'windows';
  if(platform.includes('linux')) return 'linux';
  return 'unknown';
}

export const getModifierKey = () => {
  if (getAgentSystem() == 'macos')
    return '⌘';
  return '^';
};
