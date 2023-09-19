import { writable } from 'svelte/store';
import type { CustomNodeObject } from '@/lib/graph-db';

export const selectedNode = writable<CustomNodeObject | null>(null);
