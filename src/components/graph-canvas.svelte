<script lang='ts'>
  import { liveQuery } from 'dexie';
  import ForceGraph from 'force-graph';
  import type { NodeObject, ForceGraphInstance } from 'force-graph';
  import { onMount } from 'svelte';

  import Icon from '@iconify/svelte';

  import { graphDB } from '@/lib/graph-db';
  import type { Node, CustomNodeObject, CustomLinkObject } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { graphSetup } from '@/lib/graph-canvas-utils';

  let canvas: HTMLElement;
  let graphDrawer: ForceGraphInstance;
  let zoomLevel = 0;
  $: zoomLevel
  const zoomIn = (k = 1) => {
    zoomLevel += k;
    graphDrawer.zoom(zoomLevel);
  };
  const zoomOut = (k = 1) => {
    zoomLevel -= k;
    graphDrawer.zoom(zoomLevel);
  };

  // const getCanvasCenter = () => {
  //   canvas.
  // }

  const highlightNodes = new Set<string>();
  const highlightEdges = new Set<string>();

  onMount(async () => {
    graphDrawer = ForceGraph()(canvas);
    graphSetup(graphDrawer);

    // set up for click
    graphDrawer
      .onBackgroundClick(() => {
        highlightNodes.clear();
        highlightEdges.clear();
        $selectedNode = null;
      })
      .linkWidth((link: CustomLinkObject) => highlightEdges.has(link.id!) ? 5 : 1)
      .linkDirectionalParticleWidth((link: CustomLinkObject) => highlightEdges.has(link.id!) ? 4 : 0)
      .linkDirectionalParticleColor('red')
      .linkDirectionalParticles(4)
      .onNodeClick((node: CustomNodeObject) => {
        console.log(`Node(${node.id}) selected`);
        console.debug(node)
        highlightNodes.clear();
        highlightEdges.clear();
        node.connectedEdgeId?.forEach((edgeId) => {
          console.log(edgeId);
          highlightEdges.add(edgeId);
        });
        console.debug(highlightEdges);
        $selectedNode = node;
      })
      // .nodePointerAreaPaint((node: ExtendedNode, color, ctx) => {
      //   ctx.fillStyle = color;
      //   const bckgDimensions = node.__bckgDimensions;
      //   bckgDimensions && ctx.fillRect(node.x ?? 0 - bckgDimensions[0] / 2, node.y ?? 0 - bckgDimensions[1] / 2, ...bckgDimensions);
      // })
    const graphDataObserver = await liveQuery(async () => {
      return await graphDB.getGraphForDisplay();
    });
    graphDataObserver.subscribe((graphData) => {
      graphDrawer.graphData(graphData);
      // graphDrawer.zoomToFit();
      graphDrawer.onZoom(({ k }) => {
        zoomLevel = k;
      });
    });
  });
</script>

<div class='border border-gray-500'>
  <div class="relative z-10">
    <ul class="absolute top-4 right-4 menu menu-horizontal bg-base-200 rounded-box">
      <li><a href={null} class="tooltip" data-tip="Zoom in"
        on:click={() => zoomIn()}
        >
        <Icon icon="material-symbols:zoom-in" width="20" />
      </a></li>
      <li><a href={null} class="tooltip" data-tip="Zoom out"
        on:click={() => zoomOut()}
        >
        <Icon icon="material-symbols:zoom-out" width="20" />
      </a></li>
    </ul>
  </div>
  <div id='canvas' bind:this={canvas} class="bg-zinc-900" />
</div>