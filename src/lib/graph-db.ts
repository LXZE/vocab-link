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
  createdAt: number
}

export interface NodeInfo {
  id: string
  note?: string
  [key: string]: any
}

export interface TargetNode extends Node {
  linkedEdgeId: string
  edgeCreatedAt: number
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
  createdAt: number
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

  async getNodeFromId(nodeId: string) {
    return this.db.nodes.get(nodeId);
  }
  async editNodeText(nodeId: string, text: string) {
    return this.db.nodes.update(nodeId, { text });
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
      nodes,
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
      .map(([node, edge]): TargetNode | undefined => {
        if (node && edge) {
          return {...node, linkedEdgeId: edge.id, edgeCreatedAt: edge.createdAt};
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

  async getConnectedEdgesByNodeId(nodeId: string): Promise<Edge[]> {
    return this.db.edges
      .where('sourceId').equals(nodeId)
      .or('targetId').equals(nodeId)
      .toArray();
  }

  async addDetailToNode(node: Node): Promise<NodeWithRelation> {
    const allConnectedEdges = await graphDB.getConnectedEdgesByNodeId(node.id);
    const extendedNode: NodeWithRelation = {...node,
      neighborsNodeId: [], connectedEdgeId: [],
    };
    allConnectedEdges.forEach(edge => {
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

  async addDetailToNodes(nodes: Node[]): Promise<NodeWithRelation[]> {
    const edges = await this.getAllEdges();
    const nodesMap = Object.fromEntries<NodeWithRelation>(
      nodes.map(node => [node.id, {...node,
        neighborsNodeId: [], connectedEdgeId: [],
      }])
    );
    edges.forEach(edge => {
      nodesMap[edge.sourceId].neighborsNodeId.push(edge.targetId);
      nodesMap[edge.sourceId].connectedEdgeId.push(edge.id);

      nodesMap[edge.targetId].neighborsNodeId.push(edge.sourceId);
      nodesMap[edge.targetId].connectedEdgeId.push(edge.id);
    });
    return Object.values(nodesMap);
  }

  async getNeighborWords(nodeId: string): Promise<Node[]> {
    const connectedEdgesId = (await this.getConnectedEdgesByNodeId(nodeId))
      .flatMap(edge => [edge.sourceId, edge.targetId])
      .filter(neighborNodeId => neighborNodeId != nodeId);

    return await this.db.nodes
      .where('id').anyOf(connectedEdgesId)
      .and(node => node.type == NodeType.Word)
      .toArray();
  }

  async getSecondDegreeWordNeighbors(nodeId: string): Promise<Node[]> {
    const currentNode = await this.db.nodes.get(nodeId);
    if (!currentNode) {
      throw new Error('given node id not found');
    }
    const neighborWordsNode = await this.getNeighborWords(nodeId);
    const neighborWordsSet = new Set(neighborWordsNode.map(node => node.id));

    const secondDegreeNeighborWordsNode =
      (await Promise.all(
        neighborWordsNode.map(node => this.getNeighborWords(node.id))
      ))
        .flat()
        .reduce((map: Map<string, Node>, node: Node) => {
          if (node.id != nodeId // not current node
            && !neighborWordsSet.has(node.id) // not connected node
            && !map.has(node.id)) // not duplicated node
            map.set(node.id, node);
          return map;
        }, new Map<string, Node>())
        .values();
    return Array.from(secondDegreeNeighborWordsNode);
  }

  async createNewNode(type: NodeType, text: string): Promise<Node> {
    const newNode: Node = {
      id: generateUID(), createdAt: Date.now(),
      type, text,
    };
    await this.db.nodes.add(newNode);
    return newNode;
  }

  async deleteNodeAndConnectedEdges(nodeId: string) {
    const connectedEdgesId = (await this.getConnectedEdgesByNodeId(nodeId))
      .map(edge => edge.id);
    Promise.all([
      this.db.edges.bulkDelete(connectedEdgesId),
      this.db.nodes.delete(nodeId),
    ]);
  }

  async createNewEdge(type: EdgeType, sourceId: string, targetId: string): Promise<Edge> {
    const newEdge: Edge = {
      id: generateUID(), createdAt: Date.now(),
      type, sourceId, targetId,
    };
    await this.db.edges.add(newEdge);
    return newEdge;
  }
  async deleteEdge(edgeId: string): Promise<void> {
    return this.db.edges.delete(edgeId);
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