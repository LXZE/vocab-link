<script lang='ts'>
  import { onMount } from 'svelte';
  import { watchResize } from 'svelte-watch-resize';

  import { liveQuery } from 'dexie';
  import ForceGraph, { type ForceGraphInstance } from 'force-graph';
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';
  import IconZoomIn from '@iconify/icons-material-symbols/zoom-in';
  import IconZoomOut from '@iconify/icons-material-symbols/zoom-out';
  import IconCenterFocus from '@iconify/icons-material-symbols/center-focus-strong-sharp';
  import IconExpandContent from '@iconify/icons-material-symbols/expand-content';
  import IconShrinkContent from '@iconify/icons-material-symbols/close-fullscreen';

  import { graphDB } from '@/lib/graph-db';
  import type { CustomNodeObject, CustomLinkObject, Node } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { graphSetup } from '@/lib/graph-canvas-utils';

  export let toggleGraphViewerFn: (_arg: boolean) => void;

  let canvas: HTMLElement;
  const handleResized = debounce((ev: HTMLElement) => {
    graphDrawer
      .width(ev.clientWidth)
      .height(ev.clientHeight)
      .zoomToFit(500, 20);
  }, 250);

  let graphDrawer: ForceGraphInstance;
  let zoomLevel = 0;
  let isExpandGraph = false;
  $: isExpandGraph, toggleGraphViewerFn(isExpandGraph);

  const zoomIn = (k = 0.25) => {
    zoomLevel += k;
    graphDrawer.zoom(zoomLevel, 500);
  };
  const zoomOut = (k = 0.25) => {
    zoomLevel -= k;
    graphDrawer.zoom(zoomLevel, 500);
  };
  const recenter = () => {
    graphDrawer.zoomToFit(500, 20);
  };

  const highlightNodes = new Set<string>();
  const highlightEdges = new Set<string>();
  const clearHighlight = () => {
    highlightNodes.clear();
    highlightEdges.clear();
  };
  selectedNode.subscribe(async (maybeNode) => {
    clearHighlight();
    if (maybeNode && maybeNode.id != '') {
      const detailedMaybeNode = await graphDB.addDetailToNode(maybeNode as unknown as Node);
      (detailedMaybeNode.neighborsNodeId).forEach(nodeId => highlightNodes.add(nodeId));
      (detailedMaybeNode.connectedEdgeId).forEach(edgeId => highlightEdges.add(edgeId));
    }
  });

  onMount(async () => {
    graphDrawer = ForceGraph()(canvas);
    graphSetup(graphDrawer);

    // set up for click
    graphDrawer
      .onZoom(({ k }) => zoomLevel = k)
      .onBackgroundClick(() => {
        $selectedNode = null;
      })
      .linkWidth((link: CustomLinkObject) => highlightEdges.has(link.id!) ? 5 : 1)
      .linkDirectionalParticleWidth((link: CustomLinkObject) => highlightEdges.has(link.id!) ? 4 : 0)
      .linkDirectionalParticleColor('red')
      .linkDirectionalParticles(1)
      .onNodeClick((node: CustomNodeObject) => {
        $selectedNode = node;
      })
      .nodePointerAreaPaint((node: CustomNodeObject, color, ctx) => {
        ctx.fillStyle = color;
        node.__rectDimension && ctx.fillRect(...node.__rectDimension);
      });

    const graphDataObserver = liveQuery(async () => await graphDB.getGraphForDisplay());
    let nodes: CustomNodeObject[] = [];
    let links: CustomLinkObject[] = [];
    const updateGraph = () => graphDrawer.graphData({ nodes, links });
    graphDataObserver.subscribe(({ nodes: newNodes, links: newLinks }) => {
      const { nodes: previousNode, links: previousLink } = graphDrawer.graphData();
      const previousNodeData = new Map(previousNode.map((node: CustomNodeObject) => [node.id! as string, node]));
      const previousLinkData = new Map(previousLink.map((link: CustomLinkObject) => [link.id!, link]));
      nodes = newNodes.map((node) => previousNodeData.get(node.id! as string) ?? node);
      links = newLinks.map((link) => previousLinkData.get(link.id! as string) ?? link);
      updateGraph();
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
        <Icon icon={IconZoomIn} width="20" />
      </a></li>
      <li><a href={null} class="tooltip" data-tip="Zoom out"
        on:click={() => zoomOut()}
        >
        <Icon icon={IconZoomOut} width="20" />
      </a></li>
      <li><a href={null} class="tooltip" data-tip="Re-center"
        on:click={() => recenter()}
        >
        <Icon icon={IconCenterFocus} width="20" />
      </a></li>
      {#if !isExpandGraph}
        <li><a href={null} class="tooltip" data-tip="Expand"
          on:click={() => { isExpandGraph = true; }}
          >
          <Icon icon={IconExpandContent} width="20" />
        </a></li>
      {:else}
        <li><a href={null} class="tooltip" data-tip="Mimimize"
          on:click={() => { isExpandGraph = false; }}
          >
          <Icon icon={IconShrinkContent} width="20" />
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