import { get } from 'svelte/store';
import { generateUID, createNodesMap } from '@/lib/utils';
import { ALL_LANGUAGES_MAP, ALL_POS_MAP } from '@/lib/store';
import type { DB } from '@/lib/graph-db';
import { NodeType, EdgeType, ALL_POS, ALL_LANGUAGES } from '@/utils/const';
import { seedData } from './seed_data';

export const clear_db = async(db: DB) => {
  await Promise.all([db.nodes.clear(), db.edges.clear(), db.nodeInfo.clear()]);
};

export const init_db = async (db: DB) => {
  const languages = ALL_LANGUAGES.map((language) => ({
    id: generateUID(), text: language, type: NodeType.Language, createdAt: Date.now(),
  }));
  const languageIdMap = createNodesMap(languages);
  await db.nodes.bulkAdd(languages);

  const POSs = ALL_POS.map((pos) => ({
    id: generateUID(), text: pos, type: NodeType.POS, createdAt: Date.now(),
  }));
  const POSIdMap = new Map(POSs.map((pos) => (
    [pos.text, pos.id]
  )));
  await db.nodes.bulkAdd(POSs);
  ALL_LANGUAGES_MAP.set(languageIdMap);
  ALL_POS_MAP.set(POSIdMap);
};

export const addDummyData = async (db: DB) => {
  const words = Object.keys(seedData).map((word) => ({
    id: generateUID(), text: word, type: NodeType.Word, createdAt: Date.now(),
  }));
  const wordIdMap = new Map(words.map((word) => (
    [word.text, word.id]
  )));
  await db.nodes.bulkAdd(words);

  const edges = Object.entries(seedData).flatMap(([word, { lang, pos, means }]) => {
    return [
      {
        id: generateUID(), type: EdgeType.IsLanguage,
        sourceId: wordIdMap.get(word)!, targetId: get(ALL_LANGUAGES_MAP).get(lang)!,
        createdAt: Date.now(),
      },
      {
        id: generateUID(), type: EdgeType.IsPOS,
        sourceId: wordIdMap.get(word)!, targetId: get(ALL_POS_MAP).get(pos)!,
        createdAt: Date.now(),
      },
      ...means.flatMap((meaning) => {
        return [
          {
            id: generateUID(), type: EdgeType.Means,
            sourceId: wordIdMap.get(word)!, targetId: wordIdMap.get(meaning)!,
            createdAt: Date.now(),
          },
          {
            id: generateUID(), type: EdgeType.Means,
            sourceId: wordIdMap.get(meaning)!, targetId: wordIdMap.get(word)!,
            createdAt: Date.now(),
          },
        ];
      }),
    ];
  });
  await db.edges.bulkAdd(edges);
};