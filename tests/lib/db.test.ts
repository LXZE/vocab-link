import 'fake-indexeddb/auto';

import { DB, graphDB as importGraph, WordDB } from '@/lib/graph-db';
import type { GraphDB, Node, Edge } from '@/lib/graph-db';
import { ALL_LANGUAGES, ALL_POS, EdgeType, NodeType } from '@/utils/const';

import { GraphDBTestHelper } from '@test/helpers/graph-helper';
import { waitFor } from '@test/helpers/utils';

const graphTestNodes: Node[] = [
  { id: 'n1', type: NodeType.Word, text: 'text 1', createdAt: 0, },
  { id: 'n2', type: NodeType.Word, text: 'text 2', createdAt: 0, },
  { id: 'n3', type: NodeType.Word, text: 'text 3', createdAt: 0, },
  { id: 'n4', type: NodeType.Word, text: 'text 4', createdAt: 0, },
  { id: 'n5', type: NodeType.Roman, text: 'roman 1', createdAt: 0, },
];
const graphTestEdges: Edge[] = [
  { id: 'e1', sourceId: 'n1', targetId: 'n2', type: EdgeType.Means, createdAt: 0, },
  { id: 'e2', sourceId: 'n2', targetId: 'n3', type: EdgeType.Means, createdAt: 0, },
  { id: 'e3', sourceId: 'n1', targetId: 'n5', type: EdgeType.Romanization, createdAt: 0, },
];

describe('test Graph DB', () => {
  let graphDB: GraphDB;
  let helper: GraphDBTestHelper;

  beforeAll(async () => {
    graphDB = importGraph;
    await waitFor(() => importGraph.isReady);
    helper = new GraphDBTestHelper(graphDB);
    helper.setNodes(graphTestNodes);
    helper.setEdges(graphTestEdges);
  });

  beforeEach(async () => {
    await helper.clearDB();
  });

  // On load
  it('Should already have languages and POS info in database on load', async () => {
    expect(graphDB.getAllNodesByType(NodeType.Language))
      .resolves.toHaveLength(ALL_LANGUAGES.length);
    expect(graphDB.getAllNodesByType(NodeType.POS))
      .resolves.toHaveLength(ALL_POS.length);
  });

  // Create
  it('Can create new Node and data stored in db', async () => {
    const newNode = await graphDB.createNewNode(NodeType.Word, 'test');
    await expect(graphDB.getNodeFromId(newNode.id)).resolves.toEqual(newNode);
  });
  it('Can create new Edge and data stored in db', async () => {
    await helper.initDB();
    const newEdge = await graphDB.createNewEdge(EdgeType.Means, 'n3', 'n4');
    await expect(graphDB.getAllEdges()).resolves.toContainEqual(newEdge);
  });

  // Read
  it('Can get graph for display correctly', async () => {
    await helper.initDB();
    await expect(graphDB.getGraphForDisplay()).resolves.toMatchObject({
      nodes: graphTestNodes.filter(node => !['n4'].includes(node.id)),
      links: graphTestEdges.map(graphDB.marshalEdge),
    });
  });
  it('Can get Node from its id', async () => {
    await helper.initDB();
    await expect(graphDB.getNodeFromId('n1')).resolves.toEqual(graphTestNodes[0]);
    await expect(graphDB.getNodeFromId('not_exist')).resolves.toEqual(undefined);
  });
  it('Can get all Nodes by its type correctly', async () => {
    await helper.initDB();
    await expect(graphDB.getAllNodesByType(NodeType.Word)).resolves.toEqual(
      graphTestNodes.filter(node => node.type == NodeType.Word)
    );
    await expect(graphDB.getAllNodesByType(NodeType.Roman)).resolves.toEqual(
      graphTestNodes.filter(node => node.type == NodeType.Roman)
    );
  });
  it('Can get Node\'s neighbor Nodes via nodeId', async () => {
    await helper.initDB();
    const nodesWithEdgeDetail = [{
      ...graphTestNodes[2], // n2 connect to n3
      linkedEdgeId: 'e2',
      edgeType: EdgeType.Means,
      edgeCreatedAt: 0,
    }];
    await expect(graphDB.getNeighborsNodesByNodeId('n2'))
      .resolves.toEqual(nodesWithEdgeDetail);
  });
  it('Can get source Nodes\' via target nodeId', async () => {
    await helper.initDB();
    await expect(graphDB.getNeighborsNodesByNodeId('n2', 'target'))
      .resolves.toEqual([expect.objectContaining(graphTestNodes[0])]); // n1 -> n2
  });
  it('Can get All Edges', async () => {
    await helper.initDB();
    await expect(graphDB.getAllEdges())
      .resolves.toEqual(graphTestEdges);
  });
  it('Can get List of Edges connected to Node ', async () => {
    await helper.initDB();
    await expect(graphDB.getConnectedEdgesByNodeId('n1'))
      .resolves.toEqual(expect.arrayContaining(
        graphTestEdges.filter(edge => ['e1', 'e3'].includes(edge.id))
      ));
  });
  it('Can add detail to Node correctly', async () => {
    await helper.initDB();
    graphDB.getNodeFromId('n1').then(async (node_1) => {
      await expect(graphDB.addDetailToNode(node_1!))
        .resolves.toEqual({
          ...node_1,
          neighborsNodeId: ['n2'],
          connectedEdgeId: ['e1'],
        });
    });
  });
  it('Can add get 2nd degree neighbor', async () => {
    await helper.initDB();
    await expect(graphDB.getSecondDegreeWordNeighbors('n1'))
      .resolves.toEqual([graphTestNodes[2]]);
  });

  // Update
  it('Can update Node\'s properties', async () => {
    await helper.initDB();
    // change text
    await expect(graphDB.updateNode('n1', 'text', 'new text')).resolves.not.toThrowError();
    await expect(graphDB.getNodeFromId('n1')).resolves.toMatchObject({ text: 'new text' });
    // change forms
    await expect(graphDB.updateNode('n1', 'forms', ['f1', 'f2'])).resolves.not.toThrowError();
    await expect(graphDB.getNodeFromId('n1')).resolves.toMatchObject({ forms: ['f1', 'f2'] });
    // change it again
    await expect(graphDB.updateNode('n1', 'forms', ['f0', 'f3'])).resolves.not.toThrowError();
    await expect(graphDB.getNodeFromId('n1')).resolves.toMatchObject({ forms: ['f0', 'f3'] });
  });

  // Delete
  it('Can delete Node and all connected edges', async () => {
    await helper.initDB();
    await expect(graphDB.deleteNodeAndConnectedEdges('n1')).resolves.not.toThrowError();
    await expect(graphDB.getNodeFromId('n1')).resolves.toBeUndefined();
    await expect(graphDB.getAllEdges()).resolves.toEqual(
      graphTestEdges.filter(edge => !['e1', 'e3'].includes(edge.id))
    );
  });
  it('Can delete Edge', async () => {
    await helper.initDB();
    await expect(graphDB.deleteEdge('e1')).resolves.not.toThrowError();
    await expect(graphDB.getAllEdges()).resolves.toEqual(
      graphTestEdges.filter(edge => !['e1'].includes(edge.id))
    );
  });
  it('Can delete Edge by given node id', async () => {
    await helper.initDB();
    // test if edge exists and can delete
    await expect(graphDB.deleteEdgeByNodesId('n1', 'n2')).resolves.toBe(1);
    // test if edge not exist and can handle it without raising error
    await expect(graphDB.deleteEdgeByNodesId('n1', 'n3')).resolves.toBe(0);
    await expect(graphDB.getAllEdges()).resolves.toEqual(
      graphTestEdges.filter(edge => !['e1'].includes(edge.id))
    );
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