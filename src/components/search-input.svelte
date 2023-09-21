<script lang='ts'>
  import Icon from '@iconify/svelte';
  import { debounce } from 'lodash';
  import { liveQuery } from 'dexie';
  import fuzzysort from 'fuzzysort';
  import type Fuzzysort from 'fuzzysort';

  import { graphDB, type Node } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { getAgentSystem, getModifierKey } from '@/lib/utils';
    import { NodeType } from '@/utils/const';

  const CANDIDATE_LIMIT = 10;

  interface IndexedNode extends Node {
    textPrepared: Fuzzysort.Prepared;
  }

  let allWordIndex: IndexedNode[];
  const allWordNodesObservable = liveQuery(async () => await graphDB.getAllNodesByType(NodeType.Word));
  allWordNodesObservable.subscribe(async (nodes) => {
    allWordIndex = nodes.map((node) => ({ ...node, textPrepared: fuzzysort.prepare(node.text) }));
  });

  let searchTextInputElem: HTMLInputElement;
  let searchText = '';
  let searchCandidateIndex = 0;
  let searchResultNodes: Node[] = [];

  const searchNodesByText = debounce(async (queryText: string) => {
    const result = fuzzysort.go(queryText, allWordIndex, { key: 'text', limit: CANDIDATE_LIMIT });
    searchResultNodes = result.map(res => res.obj);
    // if no exact match then suggest to add a new word.
    if (queryText.trim().length != 0 && !result.some(res => res.obj.text == searchText)) {
      searchResultNodes = [...searchResultNodes, {
        id: '', type: '', text: searchText, property: {}
      }];
    }
  }, 100, { trailing: true });

  $: searchText, searchCandidateIndex = 0;
  $: if (searchText.length > 0) {
    searchNodesByText(searchText);
  } else {
    searchResultNodes = [];
  }

  const selectWord = () => {
    selectedNode.set(searchResultNodes[searchCandidateIndex] ?? null);
    searchText = '';
    searchTextInputElem.blur();
  };

  const bodyKeydownHandler = (ev: KeyboardEvent) => {
    if (!searchTextInputElem) return;
    const isModifierKeyPressed = getAgentSystem() == 'macos' ? ev.metaKey : ev.ctrlKey;
    if (
      document.activeElement?.tagName === 'BODY' &&
      document.activeElement !== searchTextInputElem &&
      isModifierKeyPressed && ev.key == 'k'
    ) {
      ev.preventDefault();
      searchTextInputElem.focus();
    } else if (document.activeElement == searchTextInputElem) {
      switch(ev.key) {
      case 'ArrowUp':
        ev.preventDefault();
        if (searchCandidateIndex == 0) break;
        searchCandidateIndex -= 1;
        return false;
      case 'ArrowDown':
        ev.preventDefault();
        if (searchCandidateIndex == searchResultNodes.length - 1) break;
        searchCandidateIndex += 1;
        return false;
      case 'Escape':
        searchTextInputElem.blur();
        break;
      case 'Enter':
        ev.preventDefault();
        selectWord();
        break;
      default: break;
      }
    }
  };
</script>


<form id="search-word-container" class="flex flex-col gap-4 relative">
  <div class="join items-center">
      <span class="join-item"><Icon icon="material-symbols:search" /></span>
      <input bind:this={searchTextInputElem} bind:value={searchText}
        id="search-word-input" class="join-item input input-ghost w-full max-w-xs"
        name="search" type="search" placeholder="Search word…" autocomplete="off" spellcheck="false"
      />
      <div class="join-item invisible sm:visible">
        <kbd class="kbd kbd-sm">{getModifierKey()}</kbd>
        <kbd class="kbd kbd-sm">K</kbd>
      </div>
  </div>
  {#if searchText != ''}
    <ul class="
        menu bg-base-200 w-full max-w-sm rounded-box absolute top-16 z-10
        {(searchText.length > 0) ? 'visible' : 'invisible'}
      "
    >
        {#each searchResultNodes as node, idx}
          <li><a href={null} class="{searchCandidateIndex == idx ? 'active' : ''}"
            on:click={() => selectWord()}
            on:mouseenter={() => searchCandidateIndex = idx}
          >
            {#if (node.type != '')}
              {node.text}
            {:else}
              Add "{searchText}" as a new word
            {/if}
          </a></li>
        {/each}
    </ul>
  {/if}
</form>

<svelte:body on:keydown={bodyKeydownHandler} />