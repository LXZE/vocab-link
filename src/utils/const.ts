/* eslint-disable no-unused-vars */
export enum POS {
  Noun = 'Noun',
  Pronoun = 'Pronoun',
  Verb = 'Verb',
  Adjective = 'Adjective',
  Adverb = 'Adverb',
  Preposition = 'Preposition',
  Conjuction = 'Conjuction',
  Determiner = 'Determiner',
}

export const POSList = Object.values(POS);

export enum NodeType {
  Word = 'word',
  Roman = 'romanized',
  Form = 'form',
  POS = 'pos',
  Language = 'language',
  Text = 'text'
}
export const NodeTypeList = Object.values(NodeType);

export enum EdgeType {
  Means = 'means',
  Antonym = 'antonym',
  Is = 'is',
  IsPOS = 'is:pos',
  IsLanguage = 'is:language',
  IsForm = 'is:form',
  Romanization = 'romanize'
}

export const EdgeTypeList = Object.values(EdgeType);
export const twoWaysEdge = new Set([
  EdgeType.Means,
  EdgeType.Antonym,
  EdgeType.IsForm,
]);

export enum EditorState {
  NoWordSelected,
  WordSelected,
  NonWordSelected,
}
