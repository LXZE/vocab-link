<script lang='ts'>
  import { liveQuery } from 'dexie';
  import ForceGraph, { type NodeObject } from 'force-graph';
  import { onMount } from 'svelte';

  import { graphDB } from '@/lib/graph-db';
  import { graphSetup, type ExtendedNode } from '@/lib/graph-canvas-utils';

  let canvas: HTMLElement;

  let selectedNode: NodeObject | null = null;
  let highlightLinks = new Set<string>();

  onMount(async () => {
    const graphDrawer = ForceGraph()(canvas);
    graphSetup(graphDrawer);
    

    // set up for click
    graphDrawer
      .onBackgroundClick(() => {
        selectedNode = null;
      })
      .onNodeClick((node: ExtendedNode) => {
        selectedNode = node;
        // const neighbors = node.neighbors ?? [];
        // neighbors.forEach((element: string) => highlightLinks.add(element));
      });

    // graphDrawer
    //   .linkWidth(link => highlightLinks.has(link.id) ? 5 : 1)
    //   .linkDirectionalParticles(4)
    //   .linkDirectionalParticleWidth(link => highlightLinks.has(link) ? 4 : 0);

    const graphDataObserver = await liveQuery(async () => {
      return await graphDB.getGraph();
    });
    graphDataObserver.subscribe((graphData) => {
      graphDrawer.graphData(graphData);
    });
  });
</script>

<div id='canvas' bind:this={canvas} class="bg-zinc-900 border border-gray-500" />