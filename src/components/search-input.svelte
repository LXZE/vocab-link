<script lang='ts'>
  import Icon from '@iconify/svelte';
  import { debounce } from 'lodash';
  import { liveQuery } from 'dexie';

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
  let searchResultNodes: Node[] = [];
  const searchCandidateWord = debounce(async (queryText: string) => {
    const tmpCandidate = [];
    for (let node of allWordNodes) {
      if (node.text.startsWith(queryText)) {
        tmpCandidate.push(node);
      }
      if (tmpCandidate.length == CANDIDATE_LIMIT) {
        break;
      }
    }
    searchResultNodes = tmpCandidate;
  }, 100, { trailing: true });
  // let searchCandidateIndex = 0;
  $: {
    if (searchText.length > 0) {
      searchCandidateWord(searchText);
    } else {
      searchResultNodes = [];
    }
  }

  const keydownHandler = (ev: KeyboardEvent) => {
    // console.log(ev);
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
    } else if (
      document.activeElement == searchTextInputElem &&
      ev.key == 'Escape'
    ) {
      ev.preventDefault();
      searchTextInputElem.blur();
    } else {
      // switch(ev.key) {
      // case 'ArrowUp':
      //   searchCandidateIndex = 0;

      //   break;
      // case 'ArrowDown':
      //   searchCandidateIndex = Math.min(candi);
      //   break;
      // default: break
      // }
    }
  };
  const focusBlurHandler = ((isFocus: boolean) => () => { isSearchTextInputSelected = isFocus; });
</script>


<form id="search-word-container" class="flex flex-col gap-4 relative">
  <div class="join items-center">
      <span class="join-item"><Icon icon="material-symbols:search" /></span>
      <input bind:this={searchTextInputElem} bind:value={searchText}
        on:focus={focusBlurHandler(true)} on:blur={focusBlurHandler(false)}
        id="search-word-input" class="join-item input input-ghost w-full max-w-xs"
        name="search" type="search" placeholder="Search word…" autocomplete="off" spellcheck="false"
      />
      <div class="join-item invisible sm:visible">
        <kbd class="kbd kbd-sm">{getModifierKey()}</kbd>
        <kbd class="kbd kbd-sm">K</kbd>
      </div>
  </div>
  <ul class="
    menu bg-base-200 w-56 rounded-box absolute top-16
    {searchCandidateActiveClass}
  ">
      {#each searchResultNodes as node, _idx}
        <li><a href={null} on:click={() => console.log(node.text)}>
          {node.text}
        </a></li>
      {/each}
      {#if (!searchResultNodes.map(node => node.text).includes(searchText)) }
        <li><a href={null}
          on:click={(ev) => console.debug(ev)}
        >
          Add "{searchText}" as a new word
        </a>
      {/if}
  </ul>

  {#if $selectedNode}
    <h2>{ $selectedNode.text }</h2>
  {:else}
    <h2>Add a word, find a word or select in graph</h2>
  {/if}
</form>

<svelte:body on:keydown={keydownHandler} />