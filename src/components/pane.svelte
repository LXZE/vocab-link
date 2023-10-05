<script lang='ts'>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { Pane, Splitpanes } from 'svelte-splitpanes';

  import GraphCanvas from './graph-canvas.svelte';
  import SearchInput from './search-input.svelte';
  import WordEditor from './word-editor.svelte';

  import { leftPaneSize, rightPaneSize } from '@/lib/store';

  import { graphDB } from '@/lib/graph-db';
  import { init_db, addDummyData, clear_db } from '@/utils/db-action';
  import { promptDownload, promptUpload } from '@/lib/utils';

  let MINIMUM_EDITOR_WIDTH = 500; // px
  let screenSize: number;
  $: screenSize, resizeHandler();
  let minLPaneSize = 30; // Percentage
  const calculateRequiredEditorPercentage = (screenSize: number) => {
    return MINIMUM_EDITOR_WIDTH / screenSize * 100;
  };
  const resizeHandler = () => {
    minLPaneSize = calculateRequiredEditorPercentage(screenSize);
    if (lPaneSize < minLPaneSize)
      lPaneSize = minLPaneSize;
  };
  onMount(() => resizeHandler());

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

  const importDB = async () => {
    try {
      const blob = await promptUpload();
      console.log(blob);
      await graphDB.importData(blob);
    } catch (err) {
      console.error(err);
      // do nothing
      // todo: alert on screen
    }
  };
  const exportDB = async () => {
    const blob = await graphDB.exportData();
    promptDownload(blob);
  };
</script>

<Splitpanes dblClickSplitter={false} theme='custom-theme'
  on:splitter-click={resetPaneSize}
>
	<Pane bind:minSize={minLPaneSize} bind:size={lPaneSize}>
    <div id="editor-pane" class="flex flex-col p-4 gap-4 h-[100vh] overflow-y-auto">
      <span class='w-full p-2 text-center text-2xl'>Word Editor</span>
      {#if import.meta.env.DEV}
        <div class="flex justify-center">
          <button class="btn" on:click={() => init_db(graphDB.db).then(() => addDummyData(graphDB.db)) }>
            INIT DB
          </button>
          <button class="btn" on:click={() => clear_db(graphDB.db)}>
            NUKE DB
          </button>
          <button class="btn" on:click={importDB}>
            IMPORT DB
          </button>
          <button class="btn" on:click={exportDB}>
            EXPORT DB
          </button>
        </div>
      {/if}
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

<svelte:window bind:innerWidth={screenSize} />

<style lang='postcss'>
#editor-pane {
  scrollbar-width: thin;
}
</style>