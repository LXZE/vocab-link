import { NodeType, EdgeType } from '@/utils/const';

export const graphNodeColors = new Map<string, string>([
  [NodeType.Word, '#FFF6DC'],
  [NodeType.Roman, '#FFDCA9'],
  [NodeType.Language, '#79AC78'],
  [NodeType.POS, '#D2E0FB'],
  [NodeType.Text, '#FFF6DC'],
]);

export const graphNodeHighlightColors = new Map<string, string>([
  [NodeType.Word, '#FFC6AC'],
  [NodeType.Roman, '#FAAB78'],
  [NodeType.Language, '#618264'],
  [NodeType.POS, '#8EACCD'],
  [NodeType.Text, '#FFF6DC'],
]);

export const graphEdgeColors = new Map<string, string>([
  [EdgeType.Means, '#FDF4F5'],
  [EdgeType.Romanization, '#FCF9BE'],
  [EdgeType.IsLanguage, '#C0DBEA'],
  [EdgeType.IsPOS, '#FFD966'],
]);
