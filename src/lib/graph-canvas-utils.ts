import type { ForceGraphInstance, NodeObject } from 'force-graph';
import type { Node } from './graph-db';

export interface ExtendedNode extends NodeObject, Partial<Omit<Node, 'id'>> {
  neighborsNodes?: string[]
  connectedEdges?: string[]
  __bckgDimensions?: [number, number]
}

export const graphSetup = (graphInstance: ForceGraphInstance) => {
  graphInstance
    .nodeId('id')
    .nodeCanvasObject((node: ExtendedNode, ctx, globalScale) => {
      const label = node.text ?? (node.id)!.toString();
      const fontSize = (12/globalScale);
      // ctx.font = `${fontSize}px Sans-Serif`;
      ctx.font = `${fontSize}px`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + (fontSize*0.5)) as [number, number]; // some padding

      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.fillRect(
        (node.x ?? 0) - bckgDimensions[0] / 2, (node.y ?? 0) - (bckgDimensions[1]*globalScale*0.9) / 2,
        bckgDimensions[0], bckgDimensions[1]*globalScale*0.8
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // ctx.fillStyle = node.color;
      ctx.fillStyle = '#111';
      ctx.fillText(label, node.x ?? 0, node.y ?? 0);
      node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
    })
    .nodePointerAreaPaint((node: ExtendedNode, color, ctx) => {
      ctx.fillStyle = color;
      const bckgDimensions = node.__bckgDimensions;
      bckgDimensions && ctx.fillRect(node.x ?? 0 - bckgDimensions[0] / 2, node.y ?? 0 - bckgDimensions[1] / 2, ...bckgDimensions);
    })
    .linkAutoColorBy('type')
    .linkLabel('type')
    .linkDirectionalArrowRelPos(0.75)
    .linkDirectionalArrowLength(5);
};