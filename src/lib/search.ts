import { liveQuery } from 'dexie';
import fuzzysort from 'fuzzysort';
import { normalizeSync } from 'normalize-diacritics';

import { NodeType } from '@/utils/const';
import { graphDB } from '@/lib/graph-db';
import type { Node } from '@/lib/graph-db';
import type Fuzzysort from 'fuzzysort';

interface IndexedNode extends Node {
  textPrepared: Fuzzysort.Prepared;
}

const KEY_INDEX = 'textPrepared';
export let allWordIndex: IndexedNode[] = [];
export let allRomanIndex: IndexedNode[] = [];
const nodePrepareIndexMapFn = (node: Node): IndexedNode => ({ ...node,
  [KEY_INDEX]: fuzzysort.prepare(normalizeSync(node.text))
});
liveQuery(async () => await graphDB.getAllNodesByType(NodeType.Word))
  .subscribe(async (nodes) => allWordIndex = nodes.map(nodePrepareIndexMapFn));
liveQuery(async () => await graphDB.getAllNodesByType(NodeType.Roman))
  .subscribe(async (nodes) => allRomanIndex = nodes.map(nodePrepareIndexMapFn));

export type SearchOption = {
  limit?: number
  excludeNodesId?: string[]
}
const defaultOption: SearchOption = {
  limit: 10,
  excludeNodesId: [],
};
export const queryNodeByText = (queryText: string, indexedNodes: IndexedNode[], givenOptions: SearchOption) => {
  const { limit, excludeNodesId: excludeWordsId } = { ...defaultOption, ...givenOptions };
  const existIds = new Set(excludeWordsId);
  const filtererIndex = indexedNodes.filter(word => !existIds.has(word.id));
  return fuzzysort.go(normalizeSync(queryText), filtererIndex, { key: KEY_INDEX, limit })
    .map(res => res.obj);
};
