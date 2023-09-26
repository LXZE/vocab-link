<script lang='ts'>
  import { get } from 'svelte/store';
  import { Pane, Splitpanes } from 'svelte-splitpanes';

  import GraphCanvas from './graph-canvas.svelte';
  import SearchInput from './search-input.svelte';
  import WordEditor from './word-editor.svelte';

  import { leftPaneSize, rightPaneSize } from '@/lib/store';

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
>
	<Pane minSize={30} bind:size={lPaneSize}>
    <div class="flex flex-col p-4 gap-4">
      <span class='w-full text-center p-2 text-xl'>Word Editor</span>
      <div class="flex flex-col p-2 gap-2 items-stretch">
        <SearchInput />
        <WordEditor />
      </div>
    </div>
  </Pane>
	<Pane snapSize={25} bind:size={rPaneSize}>
    <div class="flex flex-col h-full w-full">
      <span class='w-full text-center p-2 text-xl'>Graph Viewer</span>
      <GraphCanvas toggleGraphViewerFn={toggleGraphViewer} />
    </div>
  </Pane>
</Splitpanes>
