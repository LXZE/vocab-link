import 'fake-indexeddb/auto';

import { queryNodeByText, nodePrepareIndexMapFn } from '@/lib/search';
import { type Node } from '@/lib/graph-db';
import { NodeType } from '@/utils/const';


const graphTestWord: Node[] = [
  { id: 'n1', type: NodeType.Word, text: 'a', createdAt: 0, },
  { id: 'n2', type: NodeType.Word, text: 'apple', createdAt: 0, },
  { id: 'n3', type: NodeType.Word, text: 'apfel', createdAt: 0, },
  { id: 'n4', type: NodeType.Word, text: 'แอปเปิ้ล', createdAt: 0, },
  { id: 'n5', type: NodeType.Word, text: '蘋果', createdAt: 0, },
  { id: 'n6', type: NodeType.Word, text: 'りんご', createdAt: 0, },
  { id: 'n7', type: NodeType.Word, text: 'pomme', createdAt: 0, },
  { id: 'n8', type: NodeType.Word, text: '사과', createdAt: 0, },
  { id: 'n9', type: NodeType.Word, text: 'תפוח', createdAt: 0, },
  { id: 'n10', type: NodeType.Word, text: 'étre', createdAt: 0, },
];

const graphTestRoman: Node[] = [
  { id: 'nr1', type: NodeType.Roman, text: 'pińggǔo', createdAt: 0, },
  { id: 'nr2', type: NodeType.Roman, text: 'ringo', createdAt: 0, },
  { id: 'nr3', type: NodeType.Roman, text: 'sagwa', createdAt: 0, },
  { id: 'nr4', type: NodeType.Roman, text: 'tapuach', createdAt: 0, },
];

describe('Test search library', () => {
  it('Can search text in several language', async () => {
    const indexedWord = graphTestWord.map(nodePrepareIndexMapFn);

    ['a', 'é', 'อ', '사', '蘋', 'り', 'ת'].forEach(character => {
      expect(queryNodeByText(character, indexedWord))
        .toEqual(expect.arrayContaining(
          graphTestWord.filter(node => node.text.includes(character))
            .map(node => expect.objectContaining(node))
        ));
    });
  });

  it('Can return empty without throwing error', async () => {
    const indexedWord = graphTestWord.map(nodePrepareIndexMapFn);

    expect(queryNodeByText('unknown', indexedWord))
      .toEqual([]);
  });

  it('Can search romanization', async () => {
    const indexedRoman = graphTestRoman.map(nodePrepareIndexMapFn);

    ['p', 'í'].forEach(character => {
      expect(queryNodeByText(character, indexedRoman))
        .toEqual(expect.arrayContaining(
          graphTestRoman.filter(node => node.text.includes(character))
            .map(node => expect.objectContaining(node))
        ));
    });
  });

});