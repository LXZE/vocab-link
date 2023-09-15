export enum POS {
  Noun = 'Noun',
  Pronoun = 'Pronoun',
  Verb = 'Verb',
  Adjective = 'Adjective',
  Adverb = 'Adverb',
  Other = 'Other',
}

export const POSList = Object.values(POS);

export enum NodeType {
	Word = 'word',
	POS = 'pos',
	Language = 'language',
	Text = 'text'
}
export const NodeTypeList = Object.values(NodeType);

export enum EdgeType {
	Means = 'means',
	Is = 'is',
	IsPOS = 'is:pos',
	IsLanguage = 'is:language',
}

export const EdgeTypeList = Object.values(EdgeType);
