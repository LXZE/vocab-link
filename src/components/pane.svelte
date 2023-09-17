<script lang='ts'>
	import { Pane, Splitpanes } from 'svelte-splitpanes';
  import GraphCanvas from '@/components/graph-canvas.svelte';

  import { graphDB } from '@/lib/graph-db';
  import { init_db, clear_db } from '@/utils/db-action';

  const clickInitDB = () => init_db(graphDB.db);
  const randomDelete = async () => {
    const allEdges = await graphDB.getEdges();
    const martyrEdges = allEdges
      .filter(() => Math.random() > 0.9)
      .map(edge => edge.id);
    await graphDB.db.edges.bulkDelete(martyrEdges);
  };
  const clickClearDB = () => clear_db(graphDB.db);
</script>

<Splitpanes dblClickSplitter={false} theme='custom-theme'>
	<Pane minSize={40}>
    <div class="flex flex-col p-2">
      <span>Word Editor</span>
      <div class="flex">
        <button class="btn" on:click={clickInitDB}>Init db</button>
        <button class="btn" on:click={randomDelete}>Random delete</button>
        <button class="btn" on:click={clickClearDB}>Nuke db</button>
      </div>
    </div>
  </Pane>
	<Pane minSize={40}>
    <div class="flex flex-col h-full">
      <span class='w-full text-center p-2 text-xl'>Graph Viewer</span>
      <GraphCanvas />
    </div>
  </Pane>
</Splitpanes>
