import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

import { DB, GraphDB, WordDB, type Node, type Edge } from '@/lib/graph-db';
import { EdgeType, NodeType } from '@/utils/const';

const graphTestNodes: Node[] = [
  { id: 'n1', type: NodeType.Word, text: 'text 1', createdAt: Date.now(), },
  { id: 'n2', type: NodeType.Word, text: 'text 2', createdAt: Date.now(), },
  { id: 'n3', type: NodeType.Word, text: 'text 3', createdAt: Date.now(), },
  { id: 'n4', type: NodeType.Word, text: 'text 4', createdAt: Date.now(), },
];
const graphTestEdges: Edge[] = [
  { id: 'e1', sourceId: 'n1', targetId: 'n2', type: EdgeType.Means, createdAt: Date.now(), },
  { id: 'e2', sourceId: 'n2', targetId: 'n3', type: EdgeType.Means, createdAt: Date.now(), },
];

class GraphDBTestHelper {
  graphDB!: GraphDB;

  constructor(graphDB: GraphDB) {
    this.graphDB = graphDB;
  }

  async addTestData() {
    this.graphDB.db.nodes.bulkAdd(graphTestNodes);
    this.graphDB.db.edges.bulkAdd(graphTestEdges);
  }
}

describe('test Graph DB', () => {
  let graphDB: GraphDB;
  let helper: GraphDBTestHelper;

  beforeAll(() => {
    const db = new DB({ indexedDB, IDBKeyRange });
    graphDB = new GraphDB(db);
    helper = new GraphDBTestHelper(graphDB);
  });

  beforeEach(async () => {
    await Promise.all([
      graphDB.db.nodes.clear(),
      graphDB.db.edges.clear(),
    ]);
  });

  it('Can create new Node and data stored in db', async () => {
    const newNode = await graphDB.createNewNode(NodeType.Word, 'test');
    expect(graphDB.getNodeFromId(newNode.id)).resolves.toEqual(newNode);
  });

  it('Can create new Edge and data stored in db', async () => {
    await helper.addTestData();
    const newEdge = await graphDB.createNewEdge(EdgeType.Means, 'n3', 'n4');
    expect(graphDB.getAllEdges()).resolves.toContainEqual(newEdge);
  });

  it('Can get graph for display correctly', async () => {
    await helper.addTestData();
    expect(graphDB.getGraphForDisplay()).resolves.toMatchObject({
      nodes: graphTestNodes.slice(0, -1), // last node not connected
      links: graphTestEdges.map(graphDB.marshalEdge),
    });
  });
});

describe('Test NodeInfo DB', () => {
  let wordDB: WordDB;
  const testNodeId = 'test_node';

  beforeAll(() => {
    const db = new DB({ indexedDB, IDBKeyRange });
    wordDB = new WordDB(db);
  });

  beforeEach(async () => {
    await wordDB.db.nodeInfo.clear();
  });

  it('Can get word note', async () => {
    expect(wordDB.getWordNoteById('')).resolves.toBe('');

    const wordNote = 'test note content';
    await wordDB.db.nodeInfo.put({
      id: testNodeId,
      note: wordNote
    });
    expect(wordDB.getWordNoteById(testNodeId)).resolves.toBe(wordNote);
  });

  it('Can update Word Note', async () => {
    const wordNote = 'test note content';

    // 0: if try to update without before add, fn should work but add new one
    await wordDB.updateWordNoteById(testNodeId, wordNote);
    expect(wordDB.getWordNoteById(testNodeId)).resolves.toBe(wordNote);

    // 1: if record can update, new note should be in the DB
    const newWordNote = 'new note content';
    await wordDB.updateWordNoteById(testNodeId, newWordNote);
    expect(wordDB.getWordNoteById(testNodeId)).resolves.toBe(newWordNote);

    // 2: if word note empty, object should be deleted
    await wordDB.updateWordNoteById(testNodeId, '');
    expect(wordDB.getWordNoteById(testNodeId)).resolves.toBe('');
  });

  it('Can delete Word Note', async () => {
    await wordDB.updateWordNoteById(testNodeId, 'test');
    await wordDB.deleteWordNoteById(testNodeId);
    expect(wordDB.getWordNoteById(testNodeId)).resolves.toBe('');
  });
});