import type { Node, LinkedNode } from '@/lib/graph-db';

export class TwoWayMap extends Map<string, string> {
  constructor(list: [string, string][]) {
    const revList = list.map(([a, b]) => [b, a]) as [string, string][];
    super([...list, ...revList]);
  }
}

/** create a Map of node.text -> node.id */
export const createNodesMap = (nodes: Node[]) => {
  return new Map(nodes.map((node) => ([node.text, node.id])));
};

export const nodeSortFn = (a: Pick<LinkedNode, 'edgeCreatedAt'>, b: Pick<LinkedNode, 'edgeCreatedAt'>) => {
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

export const removeHebrewVowels = (text: string) => {
  return text.replace(/[\u0591-\u05C7]/g, '');
};

export const normalizeWord = (word: string) => {
  return word.trim().toLowerCase();
};

export const promptDownload = (blob: Blob, fileName = 'vocab.db') => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url); // Object URLs should be revoked after use
};

export const promptUpload = async (): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    const input = document.createElement('input');
    input.type='file';
    input.accept='.db';
    input.onchange = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      const filesList = (e.currentTarget as HTMLInputElement).files;
      if (filesList == null) return reject('No file given');
      return resolve(filesList[0]);
    };
    input.click();
  });
};

