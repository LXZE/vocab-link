import Dexie, { type Table } from 'dexie';

export interface Node {
	id: string
	text: string
	type: string
}

export interface Edge {
	id: string
	type: string
	sourceId: string
	targetId: string
}

export class DB extends Dexie {
	nodes!: Table<Node>;
	edges!: Table<Edge>;

	constructor() {
		super('vocab_link_graph');
		this.version(1).stores({
			nodes: '&id,&text',
			edges: '&id,sourceId,targetId',
		});
	}
}

export const db = new DB();
