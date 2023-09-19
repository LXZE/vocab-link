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

export interface CustomLinkObject extends LinkObject {
  type: string
}

export class GraphDB {
  db!: DB;
  isDirty: boolean;
  cache: Map<string, any>;

  constructor(db: DB) {
    this.db = db;
    this.isDirty = false;
    this.cache = new Map();
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

  async getGraphForDisplay(): Promise<GraphData> {
    const { nodes, edges } = await this.getGraph();
    const result = {
      nodes: nodes.map(this.marshalNode),
      links: edges.map(this.marshalEdge),
    };
    return result;
  }

  getAllNodes(): Promise<Node[]> { return this.db.nodes.toArray(); }
  getAllEdges(): Promise<Edge[]> { return this.db.edges.toArray(); }
  async getGraph(): Promise<Graph> {
    // const cacheKey = 'getGraph';
    // if (!this.isDirty && this.cache.has(cacheKey))
    //   return this.cache.get(cacheKey);
    const [nodes, edges] = await Promise.all([this.getAllNodes(), this.getAllEdges()]);
    // this.cache.set(cacheKey, { nodes, edges });
    return { nodes, edges };
  }

  async getDetailedNodes(): Promise<NodeWithRelation[]> {
    let {nodes, edges} = await this.getGraph();
    const nodesMap = Object.fromEntries<NodeWithRelation>(
      nodes.map(node => [node.id, {...node, neighborsNodeId: [], connectedEdgeId: []}])
    );
    edges.forEach(edge => {
      nodesMap[edge.sourceId].neighborsNodeId.push(edge.targetId);
      nodesMap[edge.sourceId].connectedEdgeId.push(edge.id);

      nodesMap[edge.targetId].neighborsNodeId.push(edge.sourceId);
      nodesMap[edge.targetId].connectedEdgeId.push(edge.id);
    });
    return Object.values(nodesMap);
  }
}

export const graphDB = new GraphDB(new DB());