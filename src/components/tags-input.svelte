<script lang='ts' context='module'>
  export interface TagChoices extends Node {
    showText: string;
  }
</script>

<script lang='ts'>
  import Icon from '@iconify/svelte';
  import IconClose from '@iconify/icons-material-symbols/close';

  import { onMount } from 'svelte';

  import { graphDB } from '@/lib/graph-db';
  import type { Node, TargetNode } from '@/lib/graph-db';
  import { NodeType } from '@/utils/const';
  import { normalizeWord } from '@/lib/utils';
  import { selectedNode } from '@/lib/store';

  /** if isAllowCreate, generate new node created instead of select the exist node */
  export let isAllowCreate = false;

  /** make tag can work as button */
  export let isAllowTagClick = false;


  /** if isAllowCreate, the choice function must be provided */
  export let choiceFunction: (_queryText: string) => Promise<Node[]> = async (_) => [];

  export let label = '';
  export let autoCompleteKey = 'showText';
  export let tagType: NodeType;
  export let selectedTags: TargetNode[] = [];
  
  export let addingCallback: (_arg0: Node) => void = (_) => {};
  export let deletingCallback: (_arg1: TargetNode) => void = (_arg1: TargetNode) => {};
  
  $: internalSelectedTags = selectedTags.map(tag => ({ ...tag, showText: tag.text }));
  
  const getAllTags = async () => graphDB.getAllNodesByType(tagType);
  let allTags: Node[] = [];
  onMount(async () => {
    if (!isAllowCreate) allTags = await getAllTags();
  });
  $: selectedTagsId = new Set(selectedTags.map(node => node.id));
  $: remainChoices = allTags
    .filter(node => !selectedTagsId.has(node.id))
    .map<TagChoices>(node => ({ ...node, showText: node.text }));

  const internalAutoCompleteFn = async (queryText: string): Promise<Node[]> => {
    const normalizedQueryText = normalizeWord(queryText);

    const result = (await choiceFunction(queryText))
      .map<TagChoices>(choice => ({...choice, showText: choice.text}));

    if (normalizedQueryText.length > 0 && !result.some(res => res.text == normalizedQueryText)) {
      result.push({
        id: '', type: '', text: normalizedQueryText, createdAt: Date.now(),
        showText: `Add '${normalizedQueryText}' and connect`
      });
    }
    return result;
  };

  // todo: move this to parent
  let tagInput = '';
  let selectedChoiceIndex = 0;

  const tagClickHandler = (tag: TagChoices) => {
    // if (tagType == NodeType.Word) selectedNode.set(tag);
    // internalSelectedTags.push(tag);
    // internalSelectedTags = internalSelectedTags;
  };
  $: tagInput, selectedChoiceIndex = 0;
  const addTag = () => {
    // addingCallback();
    // normalizeWord(tagInput);
    // if (tagInput !== '') {
    //   tags.push(normalizeWord(tagInput));
    //   tags = [...tags, normalizeWord(tagInput)];
    //   tagInput = '';
    // }
  };
  const popTag = () => {
  };
  const removeTag = (index: number) => {
  };
  let inputLayout: HTMLDivElement;
  let isFocused = false;
  const onFocus = () => {
    inputLayout.classList.add('focus');
    isFocused = true;
  }
  const onBlur = () => {
    inputLayout.classList.remove('focus');
    isFocused = false;
  }

  const keydownHandler = (ev: KeyboardEvent) => {
    console.log(ev.key);
    switch(ev.key) {
    case 'Enter': return addTag();
    case 'Backspace': return popTag();
    default: break;
    }
  };

</script>

<div class="flex flex-col gap-2 my-2">
  <span>{label}</span>
  <div class='tags-input' bind:this={inputLayout}>
    <div class="tags">
      {#each internalSelectedTags as tag, idx}
        <button class={`tag ${isAllowTagClick ? 'cursor-pointer' : 'cursor-auto'}`} on:click={() => {
          if (isAllowTagClick) {
            tagClickHandler(tag);
          }
        }} >
          { Object.getOwnPropertyDescriptor(tag, autoCompleteKey)?.value }
          <button on:click={() => removeTag(idx)}>
            <span><Icon icon={IconClose} width="20" /></span>
          </button>
        </button>
      {/each}
    </div>
    <input
      type="text"
      placeholder={`Add ${label.toLowerCase()}...`}
      bind:value={tagInput}
      on:keydown={keydownHandler}
      on:focus={onFocus}
      on:blur={onBlur}
    />
  </div>
  <!-- {#if isFocused && }
    <ul class="
        menu bg-base-200 w-full max-w-md rounded-box absolute top-16 z-10
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
  {/if} -->
</div>


<style lang='postcss'>
.tags-input {
  @apply flex flex-wrap px-2 py-3 items-center content-center gap-2;
  @apply border border-transparent rounded-xl;
  @apply bg-zinc-800;

  .tags {
    @apply flex flex-wrap gap-2;
  }

  .tag {
    @apply flex gap-2 py-1 px-2 items-center content-center;
    @apply border border-zinc-700 rounded-xl;
  }

  input {
    @apply flex border-none mx-1 flex-grow;
    background: unset;
  }
  input:focus {
    @apply outline-none;
  }
}
.tags-input.focus {
  @apply border border-zinc-700;
}
</style>