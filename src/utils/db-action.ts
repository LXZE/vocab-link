import { generateUID } from '@/lib/utils';
import type { DB } from '@/lib/graph-db';
import { seedData } from './seed_data';
import { NodeType, EdgeType, POSList } from './const';

export const clear_db = async(db: DB) => {
  await Promise.all([db.nodes.clear(), db.edges.clear(), db.nodeInfo.clear()]);
};

export const init_db = async (db: DB) => {
  const languages = [
    'Thai', 'English', 'Chinese', 'Japanese', 'German', 'French', 'Korean', 'Hebrew'
  ].map((language) => ({
    id: generateUID(), text: language, type: NodeType.Language, createdAt: Date.now(),
  }));
  const languageIdMap = Object.fromEntries(languages.map((node) => (
    [node.text, node.id]
  )));
  await db.nodes.bulkAdd(languages);

  const POSs = POSList.map((pos) => ({
    id: generateUID(), text: pos, type: NodeType.POS, createdAt: Date.now(),
  }));
  const POSIdMap = Object.fromEntries(POSs.map((pos) => (
    [pos.text, pos.id]
  )));
  await db.nodes.bulkAdd(POSs);


  const words = Object.keys(seedData).map((word) => ({
    id: generateUID(), text: word, type: NodeType.Word, createdAt: Date.now(),
  }));
  const wordIdMap = Object.fromEntries(words.map((word) => (
    [word.text, word.id]
  )));
  await db.nodes.bulkAdd(words);

  const edges = Object.entries(seedData).flatMap(([word, { lang, pos, means }]) => {
    return [
      {
        id: generateUID(), type: EdgeType.IsLanguage,
        sourceId: wordIdMap[word], targetId: languageIdMap[lang],
        createdAt: Date.now(),
      },
      {
        id: generateUID(), type: EdgeType.IsPOS,
        sourceId: wordIdMap[word], targetId: POSIdMap[pos],
        createdAt: Date.now(),
      },
      ...means.flatMap((meaning) => {
        return [
          {
            id: generateUID(), type: EdgeType.Means,
            sourceId: wordIdMap[word], targetId: wordIdMap[meaning],
            createdAt: Date.now(),
          },
          {
            id: generateUID(), type: EdgeType.Means,
            sourceId: wordIdMap[meaning], targetId: wordIdMap[word],
            createdAt: Date.now(),
          },
        ];
      }),
    ];
  });
  await db.edges.bulkAdd(edges);
};