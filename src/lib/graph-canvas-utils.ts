import { get } from 'svelte/store';
import type { ForceGraphInstance } from 'force-graph';
import { graphNodeColors, graphEdgeColors } from './color';
import type { CustomLinkObject, CustomNodeObject } from './graph-db';
import { selectedNode } from './store';
import { EdgeType, twoWaysEdge } from '@/utils/const';

export const graphSetup = (graphInstance: ForceGraphInstance) => {
  const NODE_RADIUS = 12;
  const FONT_SIZE = 14; // px
  const SELECTED_PADDING = 2; // px

  graphInstance
    .autoPauseRedraw(false)
    .linkColor((link: CustomLinkObject) => {
      return graphEdgeColors.get(link.type as string) ?? '#FFFFFF';
    })
    .linkLabel((link: CustomLinkObject) => `link:${link.type}`)
    .linkDirectionalArrowRelPos(0.5)
    .linkDirectionalArrowLength((link: CustomLinkObject) => twoWaysEdge.has(link.type! as EdgeType) ? 0 : 10)
    .nodeId('id')
    .nodeRelSize(NODE_RADIUS)
    .nodeLabel((node: CustomNodeObject) => `node:${node.type}`)
    .nodeCanvasObject((node: CustomNodeObject, ctx, globalScale) => {
      const label = node.text ?? (node.id)!.toString();
      const fontSize = Math.max(FONT_SIZE / globalScale, 5);
      ctx.font = `${fontSize}px Noto Sans Hebrew, Noto Sans TC, Noto Sans JP, Noto Sans KR, Noto Sans Thai`;
      const textWidth = ctx.measureText(label).width;

      // add padding for rect
      const bckgDimensions = [textWidth, fontSize].map(n => n + (fontSize*0.5)) as [number, number];
      const rectDimension = [
        (node.x ?? 0) - bckgDimensions[0] / 2,
        (node.y ?? 0) - bckgDimensions[1] / 2,
        bckgDimensions[0],
        bckgDimensions[1]
      ] as [number, number, number, number];

      // if selected, highligh node
      if (get(selectedNode)?.id == node.id) {
        ctx.fillStyle = 'red';
        ctx.fillRect(
          rectDimension[0] - SELECTED_PADDING,
          rectDimension[1] - SELECTED_PADDING,
          rectDimension[2] + (SELECTED_PADDING * 2),
          rectDimension[3] + (SELECTED_PADDING * 2),
        );
      }

      ctx.fillStyle = graphNodeColors.get(node.type as string) ?? 'rgba(200, 200, 200, 0.8)';
      ctx.fillRect(...rectDimension);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111';
      ctx.fillText(label, node.x ?? 0, node.y ?? 0);
      node.__bckgDimensions = bckgDimensions;
      node.__rectDimension = rectDimension;
    });
};