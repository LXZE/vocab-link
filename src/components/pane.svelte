<script lang="ts">
  import { get } from "svelte/store";
  import { fade } from "svelte/transition";
  import { Pane, Splitpanes } from "svelte-splitpanes";

  import Icon from "@iconify/svelte";
  import settingsIcon from "@iconify/icons-material-symbols/settings";
  import closeIcon from "@iconify/icons-material-symbols/close";

  import GraphCanvas from "./graph-canvas.svelte";
  import SearchInput from "./search-input.svelte";
  import WordEditor from "./word-editor.svelte";
  import SettingPage from "./setting-page.svelte";

  import { leftPaneSize, rightPaneSize } from "@/lib/store";

  import { graphDB } from "@/lib/graph-db";
  import {
    init_all_default_nodes,
    addDummyData,
    clear_db,
  } from "@/utils/db-action";

  import { INFO } from "@/dev_info";

  const MINIMUM_EDITOR_WIDTH_PX = 500;
  const MINIMUM_LEFT_PANE_PERCENT = 30;
  let screenInnerWidthPX = $state(MINIMUM_EDITOR_WIDTH_PX);
  let minLeftPaneSizePercent = $state(MINIMUM_LEFT_PANE_PERCENT);

  let leftPanePercent = $state(get(leftPaneSize));
  let rightPanePercent = $state(get(rightPaneSize));

  const resetPaneSize = () => {
    leftPanePercent = 50;
    rightPanePercent = 50;
  };

  let isSettingOpen = $state(false);
  let hideComponents = $state(false);

  // if 30% of screen width is less than 500px, set minLeftPaneSizePercent to at least 500px of screen width
  const resizeHandler = (given_width_px: number) => {
    if (
      (given_width_px * MINIMUM_LEFT_PANE_PERCENT) / 100 <
      MINIMUM_EDITOR_WIDTH_PX
    ) {
      minLeftPaneSizePercent = (MINIMUM_EDITOR_WIDTH_PX / given_width_px) * 100;
    } else {
      minLeftPaneSizePercent = MINIMUM_LEFT_PANE_PERCENT;
    }
  };
  $effect(() => {
    leftPaneSize.set(leftPanePercent);
  });

  const prevPaneSize = { left: 50, right: 50 };
  const toggleGraphViewer = (isExpanded: boolean) => {
    if (isExpanded) {
      prevPaneSize.left = leftPanePercent;
      prevPaneSize.right = rightPanePercent;
      leftPanePercent = 0;
      rightPanePercent = 100;
    } else {
      leftPanePercent = prevPaneSize.left;
      rightPanePercent = prevPaneSize.right;
    }
  };
  $effect(() => resizeHandler(screenInnerWidthPX));
</script>

<Splitpanes
  dblClickSplitter={false}
  theme="custom-theme"
  on:splitter-click={resetPaneSize}
  horizontal={screenInnerWidthPX < 768}
>
  <Pane minSize={minLeftPaneSizePercent} bind:size={leftPanePercent}>
    <div
      id="editor-pane"
      class="relative flex flex-col p-4 pb-2 gap-4 h-full overflow-y-auto"
    >
      <div
        id="setting-btn"
        class="absolute top-2 right-2 tooltip tooltip-left"
        data-tip={(isSettingOpen ? "close" : "open") + " setting"}
      >
        <button
          class="btn btn-square btn-ghost"
          onclick={() => (isSettingOpen = !isSettingOpen)}
        >
          {#if isSettingOpen}
            <Icon icon={closeIcon} />
          {:else}
            <Icon icon={settingsIcon} />
          {/if}
        </button>
      </div>

      <span id="title" class="w-full p-2 text-center text-2xl">
        Vocab Link <span class="text-sm">(beta)</span>
      </span>
      {#if import.meta.env.DEV}
        <div class="flex justify-center">
          <button
            class="btn"
            onclick={() =>
              init_all_default_nodes(graphDB.db).then(() =>
                addDummyData(graphDB.db)
              )}
          >
            INIT DB
          </button>
          <button class="btn" onclick={() => clear_db(graphDB.db)}>
            NUKE DB
          </button>
        </div>
      {/if}

      <div class="flex flex-col p-2 gap-2 items-stretch">
        {#if !isSettingOpen}
          <div
            class:hidden={hideComponents}
            transition:fade={{ duration: 50 }}
            onoutrostart={() => (hideComponents = true)}
            onoutroend={() => (hideComponents = false)}
          >
            <SearchInput />
            <WordEditor />
          </div>
        {:else}
          <div
            class:hidden={hideComponents}
            transition:fade={{ duration: 50 }}
            onoutrostart={() => (hideComponents = true)}
            onoutroend={() => (hideComponents = false)}
          >
            <SettingPage />
          </div>
        {/if}
      </div>

      <footer
        id="editor-footer"
        class="footer w-full
        mt-auto pt-2 py-2
        items-center text-neutral-content
        border-t border-zinc-600
        "
      >
        <aside class="items-center grid-flow-col">
          <p>
            © 2023 - {new Date().getFullYear()} / Made with ♥ by
            <a class="underline" target="_blank" href={INFO.social_link}
              >{INFO.user_name}</a
            >
          </p>
        </aside>
        <nav
          class="grid-flow-col gap-4 md:place-self-center md:justify-self-end"
        >
          <span
            >Found a bug? report <a
              class="underline"
              target="_blank"
              href="https://github.com/LXZE/vocab-link/issues">here</a
            ></span
          >
        </nav>
      </footer>
    </div>
  </Pane>
  <Pane snapSize={25} bind:size={rightPanePercent}>
    <div class="flex flex-col h-full w-full">
      <span class="w-full text-center p-2 text-xl">Graph Viewer</span>
      <GraphCanvas toggleGraphViewerFn={toggleGraphViewer} />
    </div>
  </Pane>
</Splitpanes>

<svelte:window bind:innerWidth={screenInnerWidthPX} />

<style lang="postcss">
  #editor-pane {
    scrollbar-width: thin;
  }
</style>
