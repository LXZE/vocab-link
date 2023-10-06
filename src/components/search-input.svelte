<script lang='ts'>
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';
  import IconSearch from '@iconify/icons-material-symbols/search';
  import IconClose from '@iconify/icons-material-symbols/close';

  import { graphDB, type Node } from '@/lib/graph-db';
  import { selectedNode } from '@/lib/store';
  import { queryNodeByText, allWordIndex } from '@/lib/search';
  import { getAgentSystem, getModifierKey, normalizeWord } from '@/lib/utils';
  import { NodeType } from '@/utils/const';

  const CANDIDATE_LIMIT = 10;

  let searchTextInputElem: HTMLInputElement;
  let isSearchFocused: boolean;
  let searchText = '';
  let searchCandidateIndex = 0;
  let searchResultNodes: Node[] = [];

  const searchNodesByText = debounce((queryText: string) => {
    const normalizedQuery = normalizeWord(queryText);
    if (!normalizedQuery) {
      searchResultNodes = [];
      return;
    }
    searchResultNodes = queryNodeByText(normalizedQuery, allWordIndex, { limit: CANDIDATE_LIMIT });
    // if no exact match then suggest to add a new word.
    if (normalizedQuery.length > 0 && !searchResultNodes.some(res => res.text == searchText)) {
      searchResultNodes = [...searchResultNodes, {
        id: '', type: '', text: normalizedQuery, createdAt: Date.now(),
      }];
    }
  }, 100, { trailing: true });

  $: searchText, searchCandidateIndex = 0;
  $: if (searchText.length > 0) {
    searchNodesByText(searchText);
  } else {
    searchResultNodes = [];
  }

  const selectWord = async () => {
    const selectedResult = searchResultNodes[searchCandidateIndex] ?? null;
    if (selectedResult && selectedResult.id != '') {
      selectedNode.set(selectedResult);
    } else if (selectedResult.id == '') {
      const newNode = await graphDB.createNewNode(NodeType.Word, normalizeWord(searchText));
      selectedNode.set(newNode);
    }
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


<form id="search-word-container" class="relative flex justify-center">
  <div class="flex relative items-center justify-center max-w-md grow">
      <span class="absolute left-0 items-center pl-2">
        <Icon icon={IconSearch} width="20" />
      </span>
      <input class="pl-10 py-2 input input-ghost w-full" id="search-word-input"
        name="search" type="search" placeholder="Search word…" autocomplete="off" spellcheck="false"
        bind:this={searchTextInputElem} bind:value={searchText}
        on:focus={() => isSearchFocused = true} on:blur={() => isSearchFocused = false}
      />
      <div class="flex gap-1 items-center absolute right-0 pr-2 invisible sm:visible">
        <kbd class="kbd kbd-sm">{getModifierKey()}</kbd>
        <kbd class="kbd kbd-sm">K</kbd>
        <button class="{searchText.length > 0 ? 'visible' : 'invisible'}" on:click={(ev) => {
          ev.preventDefault();
          searchText = '';
        }}>
          <Icon icon={IconClose} width="20" />
        </button>
      </div>
  </div>
  {#if isSearchFocused && searchResultNodes.length > 0}
    <ul id="search-word-choices" class="
        menu bg-base-200 w-full max-w-md absolute top-14 z-10
        {(searchText.length > 0) ? 'visible' : 'invisible'}
      "
    >
        {#each searchResultNodes as node, idx}
          <li><a href={null} class="{searchCandidateIndex == idx ? 'active' : ''}"
            on:mousedown={(ev) => {
              // use mousedown instead of click to prevent blur behaviour
              ev.preventDefault();
              selectWord();
            }}
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