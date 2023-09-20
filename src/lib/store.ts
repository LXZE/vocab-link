import { writable, derived } from 'svelte/store';
import type { CustomNodeObject } from '@/lib/graph-db';

export const selectedNode = writable<CustomNodeObject | null>(null);

const PANE_SIZE_KEY = 'leftPaneSize';
const paneSize = localStorage.getItem(PANE_SIZE_KEY) ?? '50';
export const leftPaneSize = writable<number>(Math.max(Number.parseFloat(paneSize), 30));
export const rightPaneSize = derived(leftPaneSize, ($size) => 100 - $size);
leftPaneSize.subscribe((value) => {
  localStorage.setItem(PANE_SIZE_KEY, (value.toFixed(2)).toString());
});
