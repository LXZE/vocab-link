<script lang='ts'>
  import { liveQuery } from 'dexie';
  import ForceGraph from 'force-graph';
  import type { NodeObject, ForceGraphInstance } from 'force-graph';
  import { onMount } from 'svelte';
  
  import Icon from '@iconify/svelte';

  import { graphDB, type Node } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { graphSetup, type ExtendedNode } from '@/lib/graph-canvas-utils';

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

  
  
  let highlightLinks = new Set<string>();
  


  onMount(async () => {
    graphDrawer = ForceGraph()(canvas);
    graphSetup(graphDrawer);

    // set up for click
    graphDrawer
      .onBackgroundClick(() => {
        $selectedNode = null;
      })
      .onNodeClick((node: ExtendedNode) => {
        console.log(`Node(${node.id}) selected`);
        $selectedNode = node as Node;
        // const neighbors = node.neighbors ?? [];
        // neighbors.forEach((element: string) => highlightLinks.add(element));
      });

    // graphDrawer
    //   .linkWidth(link => highlightLinks.has(link.id) ? 5 : 1)
    //   .linkDirectionalParticles(4)
    //   .linkDirectionalParticleWidth(link => highlightLinks.has(link) ? 4 : 0);

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

<div class='w-full h-full border border-gray-500'>
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