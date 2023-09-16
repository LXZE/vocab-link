import Dexie, { type Table } from 'dexie';
import type { GraphData, NodeObject, LinkObject } from 'force-graph';

export interface Node {
  id: string
  text: string
  type: string
}

export interface NodeWithRelation extends Node {
  connectedEdgeId: string[]
  neighborsNodeId: string[]
}

export interface Edge {
  id: string
  type: string
  sourceId: string
  targetId: string
}

export interface Graph {
  nodes: Node[]
  edges: Edge[]
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

export interface CustomNodeObject extends NodeObject {
  connectedEdgeId: string[]
  neighborsNodeId: string[]
}

export interface CustomLinkObject extends LinkObject {
  type: string
}

export class GraphDB {
  db!: DB;

  constructor(db: DB) {
    this.db = db;
  }

  marshalNode(node: Node): NodeObject {
    return node;
  }

  marshalEdge(edge: Edge): CustomLinkObject {
    return {
      source: edge.sourceId,
      target: edge.targetId,
      type: edge.type,
    };
  }

  async getGraph(): Promise<GraphData> {
    const nodes = (await this.db.nodes.toArray()).map(this.marshalNode);
    const links = (await this.db.edges.toArray()).map(this.marshalEdge);
    return { nodes, links };
  }
}

export const graphDB = new GraphDB(new DB());