<script lang='ts'>
	import { Pane, Splitpanes } from 'svelte-splitpanes';
  import GraphCanvas from '@/components/graph-canvas.svelte';

  import { db } from '@/lib/db';
  import { init_db } from '@/utils/init_db';
  import { Graph } from '@/lib/graph';

  const graph = new Graph(db);

  const clickInitDB = async () => {
    await init_db(db);
  };
</script>

<Splitpanes dblClickSplitter={false} theme='custom-theme'>
	<Pane minSize={40}>
    <div class="flex p-2">
      <span>Word Editor</span>
      <button class="btn" on:click={clickInitDB}>Init db</button>
    </div>
  </Pane>
	<Pane minSize={40}>
    <div class="flex flex-col h-full">
      <span class='w-full text-center p-2 text-xl'>Graph Viewer</span>
      <GraphCanvas />
    </div>
  </Pane>
</Splitpanes>
