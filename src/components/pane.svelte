<script lang='ts'>
  import { get } from 'svelte/store';
  import { Pane, Splitpanes } from 'svelte-splitpanes';

  import GraphCanvas from './graph-canvas.svelte';
  import SearchInput from './search-input.svelte';

  import { graphDB } from '@/lib/graph-db';
  import { leftPaneSize, rightPaneSize } from '@/lib/store';
  import { init_db, clear_db } from '@/utils/db-action';

  const clickInitDB = () => init_db(graphDB.db);
  const randomDelete = async () => {
    const allEdges = await graphDB.getAllEdges();
    const martyrEdges = allEdges
      .filter(() => Math.random() > 0.9)
      .map(edge => edge.id);
    await graphDB.db.edges.bulkDelete(martyrEdges);
  };
  const clickClearDB = () => clear_db(graphDB.db);

  let pane;
  let lPaneSize = get(leftPaneSize);
  $: lPaneSize, leftPaneSize.set(lPaneSize);
  let rPaneSize = get(rightPaneSize);
  const prevPaneSize = { lPaneSize, rPaneSize };
  const toggleGraphViewer = (isExpanded: boolean) => {
    if (isExpanded) {
      prevPaneSize.lPaneSize = lPaneSize;
      prevPaneSize.rPaneSize = rPaneSize;
      lPaneSize = 0;
      rPaneSize = 100;
    } else {
      lPaneSize = prevPaneSize.lPaneSize;
      rPaneSize = prevPaneSize.rPaneSize;
    }
  };

  const resetPaneSize = () => {
    lPaneSize = 50;
    rPaneSize = 50;
  };
</script>

<Splitpanes dblClickSplitter={false} theme='custom-theme'
  on:splitter-click={resetPaneSize}
  bind:this={pane}
>
	<Pane minSize={30} bind:size={lPaneSize}>
    <div class="flex flex-col p-4 gap-2">
      <span>Word Editor</span>
      <div class="flex">
        <button class="btn" on:click={clickInitDB}>Init db</button>
        <button class="btn" on:click={randomDelete}>Random delete</button>
        <button class="btn" on:click={clickClearDB}>Nuke db</button>
      </div>
      <SearchInput />
    </div>
  </Pane>
	<Pane snapSize={25} bind:size={rPaneSize}>
    <div class="flex flex-col h-full w-full">
      <span class='w-full text-center p-2 text-xl'>Graph Viewer</span>
      <GraphCanvas toggleGraphViewerFn={toggleGraphViewer} />
    </div>
  </Pane>
</Splitpanes>
