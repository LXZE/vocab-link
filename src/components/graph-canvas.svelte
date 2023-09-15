<script lang='ts'>
  import { liveQuery } from 'dexie';
	import ForceGraph from 'force-graph';
  import type { NodeObject } from 'force-graph';
  import { onMount } from 'svelte';

  import { db } from '@/lib/db';
  import type { Node } from '@/lib/db';
  import { Graph } from '@/lib/graph';

	let canvas: HTMLElement;

  interface ExtendedNode extends NodeObject {
    text: string
    __bckgDimensions: number
  }

	onMount(async () => {
  	const graphDrawer = ForceGraph()(canvas);
    const graph = new Graph(db);
    let graphData = await graph.getGraph();
    graphDrawer.graphData(graphData)
      .nodeId('id')
      .nodeCanvasObject((node, ctx, globalScale) => {
          const label = node.text;
          const fontSize = (12/globalScale) + 4;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

          // ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // ctx.fillStyle = node.color;
          ctx.fillStyle = '#000';
          ctx.fillText(label, node.x, node.y);

          ctx

          node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
        })
      .nodePointerAreaPaint((node, color, ctx) => {
        ctx.fillStyle = color;
        const bckgDimensions = node.__bckgDimensions;
        bckgDimensions && ctx.fillRect(node.x ?? 0 - bckgDimensions[0] / 2, node.y ?? 0 - bckgDimensions[1] / 2, ...bckgDimensions);
      })
      // .nodeAutoColorBy('type')
      // .linkCanvasObjectMode(() => 'after')
      // .linkColor('#999999')
      .linkAutoColorBy('type')
      .linkLabel('type')
      .linkDirectionalArrowLength(3)
      // .linkCanvasObject((link, ctx) => {
      //     const MAX_FONT_SIZE = 5;
      //     const LABEL_NODE_MARGIN = graphDrawer.nodeRelSize() * 1.5;

      //     const start = link.source;
      //     const end = link.target;

      //     // ignore unbound links
      //     if (typeof start !== 'object' || typeof end !== 'object') return;

      //     // calculate label positioning
      //     const textPos = Object.assign(...['x', 'y'].map(c => ({
      //       [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
      //     })));

      //     const relLink = { x: end.x - start.x, y: end.y - start.y };

      //     const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

      //     let textAngle = Math.atan2(relLink.y, relLink.x);
      //     // maintain label vertical orientation for legibility
      //     if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
      //     if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

      //     const label = link.type;

      //     // estimate fontSize to fit in link length
      //     ctx.font = '1px Sans-Serif';
      //     const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
      //     ctx.font = `${fontSize}px Sans-Serif`;
      //     const textWidth = ctx.measureText(label).width;
      //     const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

      //     // draw text label (with background rect)
      //     ctx.save();
      //     ctx.translate(textPos.x, textPos.y);
      //     ctx.rotate(textAngle);

      //     ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      //     ctx.fillRect(- bckgDimensions[0] / 2, - bckgDimensions[1] / 2, ...bckgDimensions);

      //     ctx.textAlign = 'center';
      //     ctx.textBaseline = 'middle';
      //     ctx.fillStyle = 'darkgrey';
      //     ctx.fillText(label, 0, 0);
      //     ctx.restore();
      //   });

	})
</script>

<div id='canvas' bind:this={canvas} class="bg-zinc-900 border border-gray-500" />