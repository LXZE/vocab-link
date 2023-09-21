import { EdgeType, NodeType } from '@/utils/const';
import Dexie, { type Table } from 'dexie';
import type { GraphData, NodeObject, LinkObject } from 'force-graph';
import { generateUID } from './utils';
import { zip } from 'lodash';

const DB_NAME = 'vocab_link_graph';

export interface Node {
  id: string
  text: string
  type: string
}

export interface NodeInfo {
  id: string
  note?: string
  [key: string]: any
}

export interface TargetNode extends Node {
  linkedEdgeId: string
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
  nodes!: Table<Node, string>;
  edges!: Table<Edge, string>;
  nodeInfo!: Table<NodeInfo, string>;

  constructor() {
    super(DB_NAME);
    this.version(2).stores({
      nodes: '&id,&text',
      edges: '&id,sourceId,targetId',
      nodeInfo: '&id',
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

  getAllNodesByType(nodeType: NodeType): Promise<Node[]> {
    return this.db.nodes
      .filter(node => node.type == nodeType)
      .toArray();
  }

  async getAllConnectionByNodeId(nodeId: string): Promise<TargetNode[]> {
    const connectedEdges = await this.db.edges
      .where('sourceId').equals(nodeId)
      .toArray();
    const connectedNodes = await this.db.nodes.bulkGet(connectedEdges.map(edge => edge.targetId));
    return zip(connectedNodes, connectedEdges)
      .map(([node, edge]) => {
        if (node && edge) {
          return {...node, linkedEdgeId: edge.id};
        }
        return undefined;
      })
      .filter((node): node is TargetNode => node !== undefined);
  }

  getAllNodes(): Promise<Node[]> { return this.db.nodes.toArray(); }
  getAllEdges(): Promise<Edge[]> { return this.db.edges.toArray(); }
  async getGraph(): Promise<Graph> {
    const [nodes, edges] = await Promise.all([this.getAllNodes(), this.getAllEdges()]);
    return { nodes, edges };
  }

  addDetailToNode(node: Node, edges: Edge[]): NodeWithRelation {
    const extendedNode: NodeWithRelation = {...node, neighborsNodeId: [], connectedEdgeId: []};
    edges.forEach(edge => {
      if (edge.sourceId == node.id) {
        extendedNode.neighborsNodeId.push(edge.targetId);
        extendedNode.connectedEdgeId.push(edge.id);
      } else if (edge.targetId == node.id) {
        extendedNode.neighborsNodeId.push(edge.sourceId);
        extendedNode.connectedEdgeId.push(edge.id);
      }
    });
    return extendedNode;
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

  async createNewNode(type: NodeType, text: string): Promise<Node> {
    const newNode: Node = {
      id: generateUID(),
      type,
      text,
    };
    await this.db.nodes.add(newNode);
    return newNode;
  }

  async deleteNodeAndConnectedEdges(nodeId: string) {
    const connectedEdgesId = (await this.db.edges
      .where('sourceId').equals(nodeId)
      .or('targetId').equals(nodeId)
      .toArray()).map(edge => edge.id);
    Promise.all([
      this.db.edges.bulkDelete(connectedEdgesId),
      this.db.nodes.delete(nodeId),
    ]);
  }

  async createNewEdge(type: EdgeType, sourceId: string, targetId: string): Promise<Edge> {
    const newEdge: Edge = {
      id: generateUID(),
      type, sourceId, targetId
    };
    await this.db.edges.add(newEdge);
    return newEdge;
  }

  async getWordNoteById(nodeId?: string): Promise<string> {
    if (!nodeId) return '';
    return (await this.db.nodeInfo.get(nodeId))?.note ?? '';
  }

  async updateWordNoteById(nodeId: string, note: string) {
    const res = await this.db.nodeInfo.update(nodeId, { note });
    if (res == 0) {
      await this.db.nodeInfo.add({
        id: nodeId, note,
      });
    }
  }

  async deleteWordNoteById(nodeId: string) {
    await this.db.nodeInfo.delete(nodeId);
  }
}

export const graphDB = new GraphDB(new DB());