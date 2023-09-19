<script lang='ts'>
  import { getContext, onMount } from 'svelte';
  import { watchResize } from 'svelte-watch-resize';

  import { liveQuery } from 'dexie';
  import ForceGraph from 'force-graph';
  import type { ForceGraphInstance } from 'force-graph';
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';

  import { graphDB } from '@/lib/graph-db';
  import type { CustomNodeObject, CustomLinkObject } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { graphSetup } from '@/lib/graph-canvas-utils';

  export let toggleGraphViewerFn: (_arg: boolean) => void;

  let canvas: HTMLElement;
  const handleResized = debounce((ev: HTMLElement) => {
    graphDrawer
      .width(ev.clientWidth)
      .height(ev.clientHeight)
      .zoomToFit(500);
  }, 250);


  let graphDrawer: ForceGraphInstance;
  let zoomLevel = 0;
  let isExpandGraph = false;
  $: isExpandGraph, toggleGraphViewerFn(isExpandGraph);

  const zoomIn = (k = 0.2) => {
    zoomLevel += k;
    graphDrawer.zoom(zoomLevel);
  };
  const zoomOut = (k = 0.2) => {
    zoomLevel -= k;
    graphDrawer.zoom(zoomLevel);
  };
  const recenter = () => {
    graphDrawer.zoomToFit();
  };

  const highlightNodes = new Set<string>();
  const highlightEdges = new Set<string>();

  onMount(async () => {
    graphDrawer = ForceGraph()(canvas);
    graphSetup(graphDrawer);

    // set up for click
    graphDrawer
      .onBackgroundClick((ev) => {
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
        highlightNodes.clear();
        highlightEdges.clear();
        node.connectedEdgeId?.forEach((edgeId) => {
          highlightEdges.add(edgeId);
        });
        $selectedNode = node;
      })
      .nodePointerAreaPaint((node: CustomNodeObject, color, ctx) => {
        ctx.fillStyle = color;
        const rectDimension = node.__rectDimension;
        rectDimension && ctx.fillRect(...rectDimension);
      });
    const graphDataObserver = await liveQuery(async () => {
      return await graphDB.getGraphForDisplay();
    });
    graphDataObserver.subscribe((graphData) => {
      graphDrawer
        .graphData(graphData)
        // .centerAt(0, 0)
        .onZoom(({ k }) => {
          zoomLevel = k;
        });
    });
  });
</script>

<div class="border border-slate-800 h-full w-full"
  use:watchResize={handleResized}
>
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
      <li><a href={null} class="tooltip" data-tip="Re-center"
        on:click={() => recenter()}
        >
        <Icon icon="material-symbols:center-focus-strong-sharp" width="20" />
      </a></li>
      {#if !isExpandGraph}
        <li><a href={null} class="tooltip" data-tip="Expand"
          on:click={() => { isExpandGraph = true; }}
          >
          <Icon icon="material-symbols:expand-content" width="20" />
        </a></li>
      {:else}
        <li><a href={null} class="tooltip" data-tip="Mimimize"
          on:click={() => { isExpandGraph = false; }}
          >
          <Icon icon="material-symbols:close-fullscreen" width="20" />
        </a></li>
      {/if}
    </ul>
  </div>
  <div id='canvas' bind:this={canvas} />
</div>

<dialog id="graph_modal" class:modal-open={isExpandGraph}>
  <div class="modal-box w-11/12 max-w-5xl">
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">Click the button below to close</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>