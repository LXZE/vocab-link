<script lang='ts' context='module'>
  export interface TagChoices extends Node {
    showText: string;
  }
</script>

<script lang='ts'>
  import { onMount } from 'svelte';
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';
  import IconClose from '@iconify/icons-material-symbols/close';

  import { selectedNode } from '@/lib/store';
  import { graphDB } from '@/lib/graph-db';
  import type { Node, LinkedNode } from '@/lib/graph-db';
  import { NodeType } from '@/utils/const';
  import { normalizeWord } from '@/lib/utils';

  /** if true, allow component to generate new node instead of select the exist node (must provide choiceFunction) */
  export let allowCreateNode = false;
  export let allowTagClick = false;

  /** if allowCreateNode is true, the choice function must be provided */
  export let choiceFunction: (_queryText: string) => Promise<Node[]> = async (_) => [];

  export let inputLabel = '';
  export let autoCompleteObjectKey = 'showText';
  export let minimumChars = 1;
  export let tagType: NodeType;
  export let selectedTags: LinkedNode[] = [];

  export let addingCallback: (_arg0: Node) => void = (_) => {};
  export let deletingCallback: (_arg1: LinkedNode) => void = (_arg1: LinkedNode) => {};

  $: internalSelectedTags = selectedTags.map(tag => ({ ...tag, showText: tag.text }));

  let tagInput = '';
  let selectedChoiceIndex = 0;
  $: tagInput, selectedChoiceIndex = 0; // every time tag input change, select choice 0 as default

  // non word candidate choices
  let allTags: Node[] = [];
  onMount(async () => {
    if (!allowCreateNode) allTags = await graphDB.getAllNodesByType(tagType);
  });
  $: selectedTagsSet = new Set(internalSelectedTags.map(node => node.id));
  $: remainChoices = allTags
    .filter(node => !selectedTagsSet.has(node.id)) // filter only non selected
    .map<TagChoices>(node => ({ ...node, showText: node.text }));

  // word candidate choices
  const internalAutoCompleteFn = async (queryText: string): Promise<TagChoices[]> => {
    const normalizedQueryText = normalizeWord(queryText);

    const result = (await choiceFunction(queryText))
      .map<TagChoices>(choice => ({...choice, showText: choice.text}));

    if (allowCreateNode && // allow create new word
      normalizedQueryText.length > 0 && // query text is not empty string
      !internalSelectedTags.some(tag => tag.text == queryText) && // no query text in selected choice
      !result.some(res => res.text == queryText) // no query text in choices
    ) {
      result.push({
        id: '', type: '', text: normalizedQueryText, createdAt: Date.now(),
        showText: `Add '${normalizedQueryText}' and connect`
      });
    }
    return result;
  };


  let candidateChoices: TagChoices[] = [];
  const setCandidateChoices = debounce(async () => {
    if (tagInput.length < minimumChars) return;
    if (allowCreateNode) {
      candidateChoices = await internalAutoCompleteFn(tagInput);
    } else {
      candidateChoices = remainChoices
        .filter(choice => choice.text.toLowerCase().includes(tagInput.toLowerCase()));
    }
  }, 100, { trailing: true, maxWait: 200 });
  $: (tagInput, internalSelectedTags), setCandidateChoices();

  const tagClickHandler = (tag: TagChoices) => {
    if (tagType == NodeType.Word) {
      selectedNode.set(tag);
      blurHandler();
    }
  };
  const addTag = (idx: number) => {
    const selectedTag = candidateChoices[idx];
    if (selectedTag) {
      addingCallback(selectedTag);
    }
    tagInput = '';
    internalSelectedTags = internalSelectedTags;
  };
  const popTag = () => {
    const poppedTag = internalSelectedTags.pop();
    if (!poppedTag) return;
    deletingCallback(poppedTag);
    internalSelectedTags = internalSelectedTags;
  };
  const removeTag = (index: number) => {
    const [removedTag] = internalSelectedTags.splice(index, 1);
    deletingCallback(removedTag);
    internalSelectedTags = internalSelectedTags;
  };

  // element and event
  let inputLayout: HTMLDivElement;
  let inputElem: HTMLInputElement;
  let isFocused = false;
  const focusHandler = () => {
    inputLayout.classList.add('focus');
    setCandidateChoices();
    isFocused = true;
  };
  const blurHandler = () => {
    inputLayout.classList.remove('focus');
    inputElem.blur();
    candidateChoices = [];
    isFocused = false;
  };

  const keydownHandler = (ev: KeyboardEvent) => {
    // console.log(ev.key);
    switch(ev.key) {
    case 'Enter': return addTag(selectedChoiceIndex);
    case 'Backspace': {
      if (tagInput.length == 0) popTag();
      return;
    }
    case 'Escape': return blurHandler();
    case 'ArrowUp': {
      ev.preventDefault();
      selectedChoiceIndex =
      selectedChoiceIndex == 0
        ? candidateChoices.length - 1
        : selectedChoiceIndex - 1;
      return;
    }
    case 'ArrowDown': {
      ev.preventDefault();
      selectedChoiceIndex =
      selectedChoiceIndex == candidateChoices.length - 1
        ? 0
        : selectedChoiceIndex + 1;
      return;
    }
    default: break;
    }
  };

</script>

<div class='py-2'>
  <span>{inputLabel}</span>
  <div class="flex flex-col gap-2 my-2 relative">
    <div class='tags-input' bind:this={inputLayout}>
      <div class="tags">
        {#each internalSelectedTags as tag, idx}
          <button class={`tag ${allowTagClick ? 'cursor-pointer' : 'cursor-auto'}`}
            on:pointerdown={(ev) => {
              ev.preventDefault();
              if (allowTagClick) {
                tagClickHandler(tag);
              }
            }}
          >
            { Object.getOwnPropertyDescriptor(tag, autoCompleteObjectKey)?.value }
            <span on:pointerdown={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              removeTag(idx);
            }}>
              <Icon icon={IconClose} width="20" />
            </span>
          </button>
        {/each}
      </div>
      <input bind:this={inputElem}
        autocomplete="off"
        type="text"
        placeholder={`Add ${inputLabel.toLowerCase()}...`}
        bind:value={tagInput}
        on:keydown={keydownHandler}
        on:focus={focusHandler}
        on:blur={blurHandler}
      />
    </div>
    {#if isFocused && candidateChoices.length > 0}
      <ul class='menu w-full max-w-md rounded-box bg-zinc-800 absolute z-10 border border-zinc-600'
        style={`top: calc(${inputLayout.clientHeight}px + 0.5rem)`}
      >
          {#each candidateChoices as choice, idx}
            <li><a href={null} class="hover:bg-zinc-600
              {selectedChoiceIndex == idx ? 'bg-zinc-600' : ''}
            "
              on:mousedown={(ev) => {
                // use mousedown instead of click to prevent blur behaviour
                ev.preventDefault();
                addTag(idx);
              }}
              on:mouseenter={() => selectedChoiceIndex = idx}
            >
              {Object.getOwnPropertyDescriptor(choice, autoCompleteObjectKey)?.value}
            </a></li>
          {/each}
      </ul>
    {/if}
  </div>
</div>


<style lang='postcss'>
.tags-input {
  @apply flex flex-wrap gap-2 items-center content-center p-2;
  @apply border border-transparent rounded-sm;
  @apply bg-zinc-800;

  .tags {
    @apply flex flex-wrap gap-1;
  }

  .tag {
    @apply flex gap-2 py-1 px-2 items-center content-center;
    @apply border border-zinc-600 rounded-sm;
  }

  input {
    @apply mx-1 grow;
    background: unset;
  }
  input:focus {
    @apply outline-none;
  }
}
.tags-input.focus {
  @apply border border-zinc-600;
}
</style>