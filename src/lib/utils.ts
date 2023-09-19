import { NodeType, EdgeType } from '@/utils/const';

export const generateUID = () => crypto.randomUUID().slice(0, 8);

export const graphNodeColors = new Map<string, string>([
  [NodeType.Word, '#EFB495'],
  [NodeType.Language, '#AEC3AE'],
  [NodeType.POS, '#ADC4CE'],
  [NodeType.Text, '#FFF6DC'],
]);

export const graphEdgeColors = new Map<string, string>([
  [EdgeType.Means, '#FDF4F5'],
  [EdgeType.IsLanguage, '#C0DBEA'],
  [EdgeType.IsPOS, '#FFD966'],
]);
