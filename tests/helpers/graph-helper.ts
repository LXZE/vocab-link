import { GraphDB } from '@/lib/graph-db';
import type { Node, Edge } from '@/lib/graph-db';
import { NodeType } from '@/utils/const';

export class GraphDBTestHelper {
  graphDB!: GraphDB;
  nodes!: Node[];
  edges!: Edge[];

  constructor(graphDB: GraphDB) {
    this.graphDB = graphDB;
    this.nodes = [];
    this.edges = [];
  }

  setNodes(nodes: Node[]) {
    this.nodes = nodes;
  }

  setEdges(edges: Edge[]) {
    this.edges = edges;
  }

  initDB() {
    return Promise.all([
      this.graphDB.db.nodes.bulkAdd(this.nodes),
      this.graphDB.db.edges.bulkAdd(this.edges),
    ]);
  }

  clearDB() {
    return Promise.all([
      this.graphDB.db.nodes
        .where('type').anyOf([NodeType.Word, NodeType.Roman, NodeType.Form])
        .delete(),
      this.graphDB.db.edges.clear(),
    ]);
  }
}