import { liveQuery } from 'dexie';
import fuzzysort from 'fuzzysort';
import { normalizeSync } from 'normalize-diacritics';

import { NodeType } from '@/utils/const';
import { graphDB } from '@/lib/graph-db';
import type { Node } from '@/lib/graph-db';
import type Fuzzysort from 'fuzzysort';

export interface IndexedNode extends Node {
  textPrepared: Fuzzysort.Prepared;
}

const KEY_INDEX = 'textPrepared';
export let allWordIndex: IndexedNode[] = [];
export let allRomanIndex: IndexedNode[] = [];
export let allForms: string[] = [];
export const nodePrepareIndexMapFn = (node: Node): IndexedNode => ({ ...node,
  [KEY_INDEX]: fuzzysort.prepare(normalizeSync(node.text))
});
liveQuery(async () => await graphDB.getAllNodesByType(NodeType.Word))
  .subscribe(async (nodes) => {
    allWordIndex = nodes.map(nodePrepareIndexMapFn);
    allForms = nodes.flatMap(node => node.forms ?? []);
  });
liveQuery(async () => await graphDB.getAllNodesByType(NodeType.Roman))
  .subscribe(async (nodes) => allRomanIndex = nodes.map(nodePrepareIndexMapFn));

export type SearchOption = { limit?: number }
export type SearchNodeOption = SearchOption & { excludeNodesId?: string[] }
export type SearchTextOption = SearchOption & { excludeTexts?: string[] }

const defaultSearchNodeOption: SearchNodeOption = { limit: 10, excludeNodesId: [] };
export const queryNodeByText = (queryText: string, indexedNodes: IndexedNode[], givenOptions?: SearchNodeOption) => {
  const { limit, excludeNodesId: excludeWordsId } = { ...defaultSearchNodeOption, ...givenOptions };
  const existIds = new Set(excludeWordsId);
  const filteredIndex = indexedNodes.filter(word => !existIds.has(word.id));
  return fuzzysort.go(normalizeSync(queryText), filteredIndex, { key: KEY_INDEX, limit })
    .map(res => res.obj);
};

const defaultSearchTextOption: SearchTextOption = { limit: 10, excludeTexts: [] };
export const queryTextsByText = (queryText: string, texts: string[], givenOptions?: SearchTextOption) => {
  const { limit, excludeTexts } = { ...defaultSearchTextOption, ...givenOptions };
  const excludeTextsSet = new Set(excludeTexts);
  const filteredText = texts.filter(text => !excludeTextsSet.has(text));
  return fuzzysort.go(normalizeSync(queryText), filteredText, { limit })
    .map(res => res.target);
};