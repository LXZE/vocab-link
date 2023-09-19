import type { ForceGraphInstance } from 'force-graph';
import { graphNodeColors, graphEdgeColors } from './color';
import type { CustomLinkObject, CustomNodeObject } from './graph-db';

export const graphSetup = (graphInstance: ForceGraphInstance) => {
  const NODE_RADIUS = 12;
  const FONT_SIZE = 12; // px


  graphInstance
    .autoPauseRedraw(false)
    .linkColor((link: CustomLinkObject) => {
      return graphEdgeColors.get(link.type as string) ?? '#FFFFFF';
    })
    .linkLabel('type')
    .linkDirectionalArrowRelPos(0.75)
    .linkDirectionalArrowLength(5)
    .nodeId('id')
    .nodeRelSize(NODE_RADIUS)
    .nodeLabel('type')
    .nodeCanvasObject((node: CustomNodeObject, ctx, globalScale) => {
      const label = node.text ?? (node.id)!.toString();
      const fontSize = (FONT_SIZE/globalScale);
      // ctx.font = `${fontSize}px Sans-Serif`;
      ctx.font = `${fontSize}px`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + (fontSize*0.5)) as [number, number]; // some padding
      const rectDimension = [
        (node.x ?? 0) - bckgDimensions[0] / 2,
        (node.y ?? 0) - (bckgDimensions[1]*globalScale*0.9) / 2,
        bckgDimensions[0],
        bckgDimensions[1]*globalScale*0.8
      ] as [number, number, number, number];

      // if (selectedNode)

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