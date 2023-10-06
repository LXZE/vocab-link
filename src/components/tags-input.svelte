<script lang='ts'>
  import { onMount } from 'svelte';
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';
  import IconClose from '@iconify/icons-material-symbols/close';

  import { graphDB } from '@/lib/graph-db';
  import type { Node, LinkedNode } from '@/lib/graph-db';
  import { NodeType } from '@/utils/const';
  import { normalizeWord } from '@/lib/utils';

  type TagChoice = Node & { showText: string }

  /** if true, allow component to generate new node instead of only select the exist node (must provide choiceFunction) */
  export let allowCreateNode = false;
  export let allowTagClick = false;

  /** if allowCreateNode is true, the choice function must be provided */
  export let choiceFunction: (
    (_queryText: string) => Promise<Node[] | string[]>
  ) | undefined = undefined;

  export let inputLabel = '';
  export let hideLabel = false;
  export let autoCompleteObjectKey = 'showText';
  export let minimumChars = 1;
  /** used for query related Nodes */
  export let tagType: NodeType | undefined = undefined;
  export let selectedTags: LinkedNode[] | string[] = [];
  export let disableInput = false;
  export let disableRemoveTag = false;
  export let maxTags = Infinity;
  export let hideMaxTags = false;

  export let addingCallback: (_arg0: Node) => any = (_) => {};
  /** if selectedTags is string then removed tag index will be a callback argument, otherwise, tag object itself is an argument.  */
  export let deletingCallback: <T extends LinkedNode | number>(_arg1: T) => any = (_) => {};
  export let clickTagCallback: (_arg0: Node) => void = (_) => {};

  $: internalSelectedTags = selectedTags.map(tag => {
    if (typeof tag == 'object')
      return Object.assign(tag, { showText: tag.text });
    return tag;
  });

  let tagInput = '';
  let selectedChoiceIndex = 0;
  $: tagInput, selectedChoiceIndex = 0; // every time tag input change, select choice 0 as default

  // non word candidate choices
  let allTags: Node[] = [];
  onMount(async () => {
    if (!allowCreateNode && tagType) allTags = await graphDB.getAllNodesByType(tagType);
  });
  $: selectedTagsSet = new Set(internalSelectedTags.map(tag => typeof tag == 'object' ? tag.id : tag));
  $: remainChoices = allTags
    .filter(node => !selectedTagsSet.has(node.id)) // filter only non selected
    .map<TagChoice>(node => ({ ...node, showText: node.text }));

  // word candidate choices
  const createEmptyChoice = (text: string, showText: string): TagChoice => ({
    id: '', type: tagType ?? '', text, showText, createdAt: Date.now(),
  });
  const internalAutoCompleteFn = async (queryText: string): Promise<TagChoice[]> => {
    if (!allowCreateNode)
      throw Error('choiceFunction must be call only if allowCreateNode is set to true');
    if (choiceFunction === undefined)
      throw Error('choiceFunction not provided when allowCreateNode set to true');

    const normalizedQueryText = normalizeWord(queryText);

    const result = (await choiceFunction!(queryText))
      .map<TagChoice>(choice => {
        return typeof choice == 'object'
          ? {...choice, showText: choice.text}
          : createEmptyChoice(choice, choice);
      });

    if (normalizedQueryText.length > 0 && // query text is not empty string
      !internalSelectedTags.some(tag =>
        typeof tag == 'string' ? tag == queryText : tag.text == queryText
      ) && // no query text in selected choice
      !result.some(res => res.text == queryText) // no query text in choices
    ) {
      result.push({
        id: '', type: '', text: normalizedQueryText, createdAt: Date.now(),
        showText: `Add '${normalizedQueryText}' and connect`
      });
    }
    return result;
  };

  let candidateChoices: TagChoice[] = [];
  const setCandidateChoices = debounce(async () => {
    if (tagInput.length < minimumChars) return;

    candidateChoices = allowCreateNode
      ? await internalAutoCompleteFn(tagInput)
      : remainChoices.filter(choice =>
        choice.text.toLowerCase().includes(tagInput.toLowerCase())
      );
  }, 100, { trailing: true, maxWait: 200 });
  $: (tagInput, internalSelectedTags), setCandidateChoices();

  const tagClickHandler = (tag: TagChoice) => {
    if (allowTagClick) {
      blurHandler();
      clickTagCallback(tag);
    }
  };
  const addTag = (idx: number) => {
    if (selectedTags.length >= maxTags) return;
    const selectedTag = candidateChoices[idx];
    if (selectedTag) {
      addingCallback(selectedTag);
    }
    tagInput = '';
    internalSelectedTags = internalSelectedTags;
  };
  const popTag = () => {
    const last_index = internalSelectedTags.length - 1;
    const poppedTag = internalSelectedTags.pop();
    if (!poppedTag) return;
    deletingCallback(typeof poppedTag == 'string' ? last_index : poppedTag as LinkedNode);
    internalSelectedTags = internalSelectedTags;
  };
  const removeTag = (idx: number) => {
    const [removedTag] = internalSelectedTags.splice(idx, 1);
    deletingCallback(typeof removedTag == 'string' ? idx : removedTag as LinkedNode);
    internalSelectedTags = internalSelectedTags;
  };

  // element and event
  let inputLayout: HTMLDivElement;
  let inputElem: HTMLInputElement;
  let isFocused = false;
  const focusHandler = () => {
    if (inputLayout) inputLayout.classList.add('focus');
    setCandidateChoices();
    isFocused = true;
  };
  const blurHandler = () => {
    if (inputLayout) inputLayout.classList.remove('focus');
    if (inputElem) inputElem.blur();
    candidateChoices = [];
    isFocused = false;
  };

  const keydownHandler = (ev: KeyboardEvent) => {
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

<div class={`py-2 ${$$props.class}`}>
  {#if !hideLabel}
    <span>{inputLabel}</span>
  {/if}
  {#if !hideMaxTags && maxTags != Infinity}
    <span class="text-sm underline text-zinc-500">Max links = {maxTags}</span>
  {/if}
  <div class="flex flex-col gap-2 my-2 relative"
    role="textbox" tabindex="0"
    on:mousedown={(ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      inputElem.focus();
    }}
  >
    <div class="tags-input" bind:this={inputLayout}>
      {#if internalSelectedTags.length > 0}
        <div class="tags">
          {#each internalSelectedTags as tag, idx}
            <button class={`tag ${allowTagClick ? 'cursor-pointer' : 'cursor-auto'}`}
              on:pointerdown={(ev) => {
                ev.preventDefault();
                typeof tag == 'object' && tagClickHandler(tag);
              }}
            >
              {
                typeof tag == 'string'
                  ? tag
                  : Object.getOwnPropertyDescriptor(tag, autoCompleteObjectKey)?.value
              }
              {#if !disableRemoveTag}
                <span class='cursor-pointer'
                  on:pointerdown={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    removeTag(idx);
                  }}
                >
                  <Icon icon={IconClose} width="20" />
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
      {#if !disableInput && internalSelectedTags.length < maxTags}
        <input bind:this={inputElem}
          autocomplete="off"
          type="text"
          placeholder={`Add ${inputLabel.toLowerCase()}...`}
          bind:value={tagInput}
          on:keydown={keydownHandler}
          on:focus={focusHandler}
          on:blur={blurHandler}
        />
      {/if}
    </div>
    {#if isFocused && tagInput.length >= minimumChars && candidateChoices.length > 0}
      <ul id="tag-choices-list"
        class='menu w-full max-w-md rounded-box bg-zinc-800 absolute z-10 border border-zinc-600'
        style={`top: calc(${inputLayout.clientHeight}px + 0.5rem)`}
      >
          {#each candidateChoices as choice, idx}
            <li><a href={null} class="hover:bg-zinc-600
              {selectedChoiceIndex == idx ? 'bg-zinc-600' : ''}
            "
              on:mousedown={(ev) => {
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
  @apply flex flex-wrap gap-2 p-2;
  @apply border border-transparent rounded-sm;
  @apply bg-zinc-800;

  &.focus {
    @apply border border-zinc-600;
  }

  .tags {
    @apply flex flex-wrap gap-1;
  }

  .tag {
    @apply flex gap-2 py-1 px-2 items-center content-center;
    @apply border border-zinc-600 rounded-sm;
  }

  input {
    @apply mx-1;

    &:focus {
      @apply outline-none;
    }
    background: unset;
  }
}
</style>