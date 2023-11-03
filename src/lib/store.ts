import { writable, derived } from 'svelte/store';
import { liveQuery } from 'dexie';

import { graphDB, type CustomNodeObject } from '@/lib/graph-db';
import { NodeType } from '@/utils/const';
import { createNodesMap } from './utils';
import { waitFor } from '@test/helpers/utils';

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


type NodeIdMap = Map<string, string>;
export const ALL_LANGUAGES_MAP = writable<NodeIdMap>(new Map());
export const ALL_POS_MAP = writable<NodeIdMap>(new Map());
let _lang$;
let _pos$;

// export const ALL_POS_MAP = writable<Map<string, string>>(new Map());
waitFor(() => graphDB.isReady).then(() => {
  _lang$ = liveQuery<NodeIdMap>(async () =>
    createNodesMap(await graphDB.getAllNodesByType(NodeType.Language))
  ).subscribe(newMap => ALL_LANGUAGES_MAP.set(newMap));
  _pos$ = liveQuery<Map<string, string>>(async () =>
    createNodesMap(await graphDB.getAllNodesByType(NodeType.POS))
  ).subscribe(newMap => ALL_POS_MAP.set(newMap));
});
