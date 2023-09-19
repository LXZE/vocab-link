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

export interface CustomNodeObject extends NodeObject, Partial<Omit<NodeWithRelation, 'id'>> {
  __bckgDimensions?: [number, number]
  __rectDimension?: [number, number, number, number]
}


export interface CustomLinkObject extends LinkObject {
  id?: string
  type?: string
}

export interface CustomGraphData extends GraphData {
  nodes: CustomNodeObject[]
  links: CustomLinkObject[]
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

  marshalEdge(edge: Edge): CustomLinkObject {
    return {
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: edge.type,
    };
  }

  async getGraphForDisplay(): Promise<CustomGraphData> {
    const { nodes, edges } = await this.getGraph();
    const result = {
      nodes: this.addDetailToNodes(nodes, edges),
      links: edges.map(this.marshalEdge),
    };
    return result;
  }

  getAllNodes(): Promise<Node[]> { return this.db.nodes.toArray(); }
  getAllEdges(): Promise<Edge[]> { return this.db.edges.toArray(); }
  async getGraph(): Promise<Graph> {
    const [nodes, edges] = await Promise.all([this.getAllNodes(), this.getAllEdges()]);
    return { nodes, edges };
  }

  addDetailToNodes(nodes: Node[], edges: Edge[]): NodeWithRelation[] {
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