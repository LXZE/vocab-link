import { writable, derived } from 'svelte/store';
import { liveQuery } from 'dexie';
import fuzzysort from 'fuzzysort';
import { normalizeSync } from 'normalize-diacritics';

import { NodeType } from '@/utils/const';
import { graphDB } from '@/lib/graph-db';
import type { CustomNodeObject, Node } from '@/lib/graph-db';
import type Fuzzysort from 'fuzzysort';

export const selectedNode = writable<CustomNodeObject | undefined>();
export const selectedNodeId = derived(selectedNode, (currentNode) => {
  if (!currentNode) return;
  return currentNode.id as string;
});

interface IndexedNode extends Node {
  textPrepared: Fuzzysort.Prepared;
}

export let allWordIndex: IndexedNode[] = [];
const allWordNodesObservable = liveQuery(async () => await graphDB.getAllNodesByType(NodeType.Word));
allWordNodesObservable.subscribe(async (nodes) => {
  allWordIndex = nodes.map((node) => ({
    ...node,
    textPrepared: fuzzysort.prepare(normalizeSync(node.text))
  }));
});

export type SearchOption = {
  limit?: number
  excludeWordsId?: string[]
}
const defaultOption: SearchOption = {
  limit: 10,
  excludeWordsId: [],
};
export const queryNodeByText = (queryText: string, givenOptions: SearchOption) => {
  const { limit, excludeWordsId } = { ...defaultOption, ...givenOptions };
  const existIds = new Set(excludeWordsId);
  const filtererIndex = allWordIndex.filter(word => !existIds.has(word.id));
  return fuzzysort.go(normalizeSync(queryText), filtererIndex, { key: 'textPrepared', limit })
    .map(res => res.obj);
};

const PANE_SIZE_KEY = 'leftPaneSize';
const paneSize = localStorage.getItem(PANE_SIZE_KEY) ?? '50';
export const leftPaneSize = writable<number>(Math.max(Number.parseFloat(paneSize), 30));
export const rightPaneSize = derived(leftPaneSize, ($size) => 100 - $size);
leftPaneSize.subscribe((value) => {
  localStorage.setItem(PANE_SIZE_KEY, (value.toFixed(2)).toString());
});
