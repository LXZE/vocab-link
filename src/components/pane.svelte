<script lang='ts'>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import { Pane, Splitpanes } from 'svelte-splitpanes';

  import Icon from '@iconify/svelte';
  import settingsIcon from '@iconify/icons-material-symbols/settings';
  import closeIcon from '@iconify/icons-material-symbols/close';

  import GraphCanvas from './graph-canvas.svelte';
  import SearchInput from './search-input.svelte';
  import WordEditor from './word-editor.svelte';
  import SettingPage from './setting-page.svelte';

  import { leftPaneSize, rightPaneSize } from '@/lib/store';

  import { graphDB } from '@/lib/graph-db';
  import { init_db, addDummyData, clear_db } from '@/utils/db-action';

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


  let isSettingOpen = false;
  let hideComponents = false;

</script>

<Splitpanes dblClickSplitter={false} theme='custom-theme'
  on:splitter-click={resetPaneSize}
>
	<Pane bind:minSize={minLPaneSize} bind:size={lPaneSize}>
    <div id="editor-pane" class="relative flex flex-col p-4 pb-2 gap-4 h-[100vh] overflow-y-auto">

      <div id='setting-btn' class='absolute top-2 right-2 tooltip tooltip-left'
        data-tip={(isSettingOpen ? 'close': 'open') + ' setting'}
      >
        <button class="btn btn-square btn-ghost" on:click={() => isSettingOpen = !isSettingOpen}>
          {#if isSettingOpen}
            <Icon icon={closeIcon} />
          {:else}
            <Icon icon={settingsIcon} />
          {/if}
        </button>
      </div>

      <span id='title' class='w-full p-2 text-center text-2xl'>
        Vocab Link <span class="text-sm">(beta)</span>
      </span>
      {#if import.meta.env.DEV}
        <div class="flex justify-center">
          <button class="btn" on:click={() => init_db(graphDB.db).then(() => addDummyData(graphDB.db)) }>
            INIT DB
          </button>
          <button class="btn" on:click={() => clear_db(graphDB.db)}>
            NUKE DB
          </button>
        </div>
      {/if}

      <div class="flex flex-col p-2 gap-2 items-stretch">
        {#if !isSettingOpen}
          <div class:hidden={hideComponents}
            transition:fade={{ duration: 50 }}
            on:outrostart={() => hideComponents = true}
            on:outroend={() => hideComponents = false}
          >
            <SearchInput />
            <WordEditor />
          </div>
        {:else}
          <div class:hidden={hideComponents}
            transition:fade={{ duration: 50 }}
            on:outrostart={() => hideComponents = true}
            on:outroend={() => hideComponents = false}
          >
            <SettingPage />
          </div>
        {/if}
      </div>

      <footer id='editor-footer'
        class='footer w-full
        mt-auto pt-2 py-2
        items-center text-neutral-content
        border-t border-zinc-600
        '
      >
        <aside class="items-center grid-flow-col">
          <p>© 2023 / Made with ♥ by <a class='underline' href="https://twitter.com/lxze">@LXZE</a></p>
        </aside>
        <nav class="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
          <span>Found a bug? report <a class='underline' href="https://github.com/LXZE/vocab-link/issues">here</a></span>
        </nav>
      </footer>

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