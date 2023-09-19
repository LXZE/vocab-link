import { writable } from 'svelte/store';
import type { Node } from '@/lib/graph-db';

export const selectedNode = writable<Node | null>(null);
