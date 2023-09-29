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
      .height(ev.clientHeight);
    if ($selectedNode) {
      graphDrawer.centerAt($selectedNode.x, $selectedNode.y, 500);
    } else {
      graphDrawer.zoomToFit(500, 20);
    }
  }, 100);

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
  const recenter = () => graphDrawer.zoomToFit(500, 20);

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

      const existNodeData = graphDrawer.graphData().nodes.find(node => node.id == maybeNode.id);
      if (!existNodeData) return;
      graphDrawer
        .centerAt(existNodeData.x, existNodeData.y, 500)
        .zoomToFit(500, 50, (node: CustomNodeObject) => {
          return highlightNodes.has(node.id! as string) || node.id == maybeNode.id;
        });
    }
    else if (graphDrawer != undefined) {
      graphDrawer
        .zoomToFit(500, 20)
        .centerAt(0, 0, 500);
    }
  });

  onMount(() => {
    graphDrawer = ForceGraph()(canvas);
    graphSetup(graphDrawer);

    // set up for click
    graphDrawer
      .onZoom(({ k }) => zoomLevel = k)
      .onBackgroundClick(() => {
        selectedNode.set(undefined);
      })
      .linkWidth((link: CustomLinkObject) => highlightEdges.has(link.id!) ? 5 : 1)
      .linkDirectionalParticleWidth((link: CustomLinkObject) => highlightEdges.has(link.id!) ? 4 : 0)
      .linkDirectionalParticles(1)
      .linkDirectionalParticleColor('#000000')
      .onNodeClick((node: CustomNodeObject) => {
        selectedNode.set(node);
      })
      .nodeVisibility((node: CustomNodeObject) => {
        if (!$selectedNode) return true; // if no any node selected, then show all
        // otherwise, show only selected node and highlight nodes
        return node.id == $selectedNode.id || highlightNodes.has(node.id as string);
      })
      .linkVisibility((link: CustomLinkObject) => {
        if (!$selectedNode) return true; // if no any node selected, then show all
        // otherwise, show only highlight edges
        return highlightEdges.has(link.id as string);
      })
      .nodePointerAreaPaint((node: CustomNodeObject, color, ctx) => {
        ctx.fillStyle = color;
        node.__rectDimension && ctx.fillRect(...node.__rectDimension);
      });

    const graphDataObserver = liveQuery(async () => await graphDB.getGraphForDisplay());
    let nodes: CustomNodeObject[] = [];
    let links: CustomLinkObject[] = [];
    const updateGraph = () => graphDrawer.graphData({ nodes, links });
    const graphSubscription = graphDataObserver.subscribe(({ nodes: newNodes, links: newLinks }) => {
      const { nodes: previousNode, links: previousLink } = graphDrawer.graphData();
      const previousNodeData = new Map(previousNode.map((node: CustomNodeObject) => [node.id! as string, node]));
      const previousLinkData = new Map(previousLink.map((link: CustomLinkObject) => [link.id!, link]));
      nodes = newNodes.map((node) => {
        const newNode = previousNodeData.get(node.id! as string) ?? node;
        newNode.text = node.text;
        return newNode;
      });
      links = newLinks.map((link) => previousLinkData.get(link.id! as string) ?? link);
      updateGraph();
    });

    return () => {
      graphDrawer.pauseAnimation();
      graphDrawer.graphData({ nodes: [], links: [] });
      graphSubscription.unsubscribe();
    };
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
