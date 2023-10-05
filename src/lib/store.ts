import { writable, derived } from 'svelte/store';
import type { CustomNodeObject } from '@/lib/graph-db';

export const selectedNode = writable<CustomNodeObject | undefined>();
export const selectedNodeId = derived(selectedNode, (currentNode) => {
  if (!currentNode) return;
  return currentNode.id as string;
});

const PANE_SIZE_KEY = 'leftPaneSize';
const paneSize = localStorage.getItem(PANE_SIZE_KEY) ?? '50';
export const leftPaneSize = writable<number>(Math.max(Number.parseFloat(paneSize), 30));
export const rightPaneSize = derived(leftPaneSize, ($size) => 100 - $size);
leftPaneSize.subscribe((value) => {
  localStorage.setItem(PANE_SIZE_KEY, (value.toFixed(2)).toString());
});

export const ALL_LANGUAGES_MAP = writable<Map<string, string>>(new Map());
export const ALL_POS_MAP = writable<Map<string, string>>(new Map());
