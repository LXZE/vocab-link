<script lang='ts'>
  // @ts-ignore
  import Tags from 'svelte-tags-input';
  import { debounce } from 'lodash';
  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';

  import { selectedNode } from '@/lib/store';
  import { NodeType, EditorState } from '@/utils/const';
  import { graphDB } from '@/lib/graph-db';
    import { liveQuery } from 'dexie';

  let currentEditorState: EditorState = EditorState.NoWordSelected;
  $: currentEditorState, console.log(currentEditorState);
  $: {
    if ($selectedNode == null) { currentEditorState = EditorState.NoWordSelected; }
    else if ($selectedNode.id == '') { currentEditorState = EditorState.NewWordCreated; }
    else if ($selectedNode.type !== NodeType.Word) { currentEditorState = EditorState.NonWordSelected; }
    else { currentEditorState = EditorState.WordSelected; }
  }

  let editorStatusText: string;
  $: {
    switch(currentEditorState) {
    case EditorState.NoWordSelected:
      editorStatusText = 'Try to search a word or select in graph'; break;
    case EditorState.NewWordCreated:
      editorStatusText = `New word: ${ $selectedNode!.text }`; break;
    case EditorState.WordSelected:
      editorStatusText = `${$selectedNode!.type?.toUpperCase()}: ${ $selectedNode!.text }`; break;
    case EditorState.NonWordSelected:
      editorStatusText = `Word: ${ $selectedNode!.text }`; break;
    default: break;
    }
  }

  let wordNote: string = $selectedNode?.property?.note ?? '';
  const updateWordNote = debounce(async (nodeId: string) => {
    await graphDB.updateWordNoteById(nodeId, wordNote);
  }, 200, { trailing: true, maxWait: 500 });
  // const noteChangeHandler = (ev: InputEvent) => {
  //   console.log(ev.target.value);
  // };
  
  let languageChoices = liveQuery(async () => {
    const res = await graphDB.getAllNodesByType(NodeType.Language);
    console.log(res)
    return res;
  });
  // let allConnectedNode = liveQuery(async () => {
  //   if ($selectedNode && $selectedNode.id != '')
  //     return await graphDB.getAllConnectionByNodeId($selectedNode.id as string);
  //   return [];
  // });
  let currentSelectedLanguage: string[] = [];
  // allConnectedNode.subscribe((connectedNode) => {
  //   currentSelectedLanguage = connectedNode
  //     .filter(node => node.type == NodeType.Language)
  //     .map(node => node.text);
  //   console.log(currentSelectedLanguage)
  // });


</script>

<div class="flex flex-col override-default-tags">
  <div class="flex gap-2 p-2 items-baseline justify-between">
    <span>{editorStatusText}</span>
    {#if currentEditorState !== EditorState.NoWordSelected}
      <button class="btn btn-square" on:click={() => $selectedNode = null}>
        <Icon icon={closeIcon} />
      </button>
    {/if}
  </div>

  {#if [EditorState.WordSelected, EditorState.NewWordCreated].includes(currentEditorState)}
    <div class='flex flex-col gap-2 my-2'>
      <span>Language</span>
      <Tags tags={currentSelectedLanguage} 
        autoComplete={$languageChoices} autoCompleteKey={'text'}
        onlyAutocomplete onlyUnique
      />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Part of speech</span>
      <Tags tags={[]} />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Meaning</span>
      <Tags tags={[]} />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Note</span>
      <input type="text" bind:value={wordNote}>
    </div>

    <div class="flex">
      <button class="btn btn-success">
        Save
      </button>
    </div>
  {/if}

</div>

<!-- svelte-ignore css-unused-selector -->
<style lang='postcss'>

.override-default-tags {
  :global(.svelte-tags-input-layout) {
    @apply bg-zinc-800 border-zinc-700 !important;
  }
  :global(.svelte-tags-input-layout.focus) {
    @apply border-zinc-500 !important;
  }
  :global(.svelte-tags-input-tag) {
    @apply badge badge-lg !important;
    /* @apply bg-zinc-600 !important; */
  }
}

</style>