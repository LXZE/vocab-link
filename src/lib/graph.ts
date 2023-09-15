import type { GraphData, NodeObject, LinkObject } from 'force-graph';
import type { DB, Node, Edge } from "@/lib/db";

// import { NodeType, EdgeType, POSList } from "@/utils/const";

export interface IGraph {
	nodes: Node[]
	links: Edge[]
}

export interface CustomLinkObject extends LinkObject {
	type: string
}

export class Graph {
	db!: DB

	constructor(db: DB) {
		this.db = db;
	}

	nodeMarshal(node: Node): NodeObject {
		return node;
	}

	edgeMarshal(edge: Edge): CustomLinkObject {
		return {
			source: edge.sourceId,
			target: edge.targetId,
			type: edge.type,
		};
	}

	async getGraph(): Promise<GraphData> {
		const nodes = await this.db.nodes.toArray();
		const links = (await this.db.edges.toArray()).map(this.edgeMarshal);
		return { nodes, links };
	}
}