<script lang='ts'>
  import Icon from '@iconify/svelte';
  import { debounce } from 'lodash';
  import { liveQuery } from 'dexie';
  import fuzzysort from 'fuzzysort';

  import { graphDB, type Node } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { getAgentSystem, getModifierKey } from '@/lib/utils';

  const CANDIDATE_LIMIT = 10;

  let allWordNodes: Node[];
  const allWordNodesObservable = liveQuery(async () => {
    return await graphDB.getAllWordNodes();
  });
  allWordNodesObservable.subscribe(async (nodes) => {
    allWordNodes = nodes;
  });

  let searchTextInputElem: HTMLInputElement;
  let isSearchTextInputSelected = false;
  $: searchCandidateActiveClass = (isSearchTextInputSelected && searchText.length > 0)
    ? 'visible' : 'invisible';

  let searchText = '';
  let searchCandidateIndex = 0;
  let searchResultNodes: Node[] = [];

  const searchNodesByText = debounce(async (queryText: string) => {
    const result = fuzzysort.go(queryText, allWordNodes, { key: 'text', limit: CANDIDATE_LIMIT });
    searchResultNodes = result.map(res => res.obj);
    if (!result.some(res => res.obj.text == searchText)) {
      searchResultNodes = [...searchResultNodes, {
        id: '', type: '', text: `Add "${searchText}" as a new word`
      }];
    }
  }, 100, { trailing: true });
  $: searchText, searchCandidateIndex = 0;
  $: {
    if (searchText.length > 0) {
      searchNodesByText(searchText);
    } else {
      searchResultNodes = [];
    }
  }

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
      isSearchTextInputSelected = true;
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
        console.log(searchCandidateIndex);
        selectedNode.set(searchResultNodes[searchCandidateIndex] ?? null);
        searchText = '';
        // if selected Node is null, move word editor to add new word and move searchTextInput to new word
        // else then move to word edit page
        break;
      default: break;
      }
    }
  };

  // const searchKeyHandler = (ev: KeyboardEvent) => {
  //   if (!searchTextInputElem) return;
  //   switch(ev.key) {
    
  //   default: break;
  //   }
  // };
  
  const focusBlurHandler = ((isFocus: boolean) => () => {
    setTimeout(() => {
      isSearchTextInputSelected = isFocus;
    }, 100);
  });
</script>


<form id="search-word-container" class="flex flex-col gap-4 relative">
  <div class="join items-center">
      <span class="join-item"><Icon icon="material-symbols:search" /></span>
      <input bind:this={searchTextInputElem} bind:value={searchText}
        on:focus={focusBlurHandler(true)}
        on:blur={focusBlurHandler(false)}
        id="search-word-input" class="join-item input input-ghost w-full max-w-xs"
        name="search" type="search" placeholder="Search word…" autocomplete="off" spellcheck="false"
      />
      <div class="join-item invisible sm:visible">
        <kbd class="kbd kbd-sm">{getModifierKey()}</kbd>
        <kbd class="kbd kbd-sm">K</kbd>
      </div>
  </div>
  <ul class="
      menu bg-base-200 w-full max-w-sm rounded-box absolute top-16 z-10
      {searchCandidateActiveClass}
    "
  >
      {#each searchResultNodes as node, idx}
        <li><a href={null} class="{searchCandidateIndex == idx ? 'active' : ''}"
          on:click={(ev) => {
            console.debug(ev);
          }}
          on:mouseenter={(ev) => {
            ev.preventDefault();
            searchCandidateIndex = idx;
          }}
        >
          {node.text}
        </a></li>
      {/each}
  </ul>

  {#if $selectedNode}
    <h2>{ $selectedNode.text }</h2>
  {:else}
    <h2>Add a word, find a word or select in graph</h2>
  {/if}
</form>

<svelte:body on:keydown={bodyKeydownHandler} />