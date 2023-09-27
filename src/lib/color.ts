import { NodeType, EdgeType } from '@/utils/const';

export const graphNodeColors = new Map<string, string>([
  [NodeType.Word, '#FFF6DC'],
  [NodeType.Roman, '#C8AE7D'],
  [NodeType.Language, '#79AC78'],
  [NodeType.POS, '#D2E0FB'],
  [NodeType.Text, '#FFF6DC'],
]);

export const graphNodeHighlightColors = new Map<string, string>([
  [NodeType.Word, '#FFC6AC'],
  [NodeType.Roman, '#765827'],
  [NodeType.Language, '#618264'],
  [NodeType.POS, '#8EACCD'],
  [NodeType.Text, '#FFF6DC'],
]);

export const graphEdgeColors = new Map<string, string>([
  [EdgeType.Means, '#FDF4F5'],
  [EdgeType.Romanization, '#EAC696'],
  [EdgeType.IsLanguage, '#7EAA92'],
  [EdgeType.IsPOS, '#9F91CC'],
]);
