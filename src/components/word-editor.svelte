<script lang='ts'>
  // @ts-ignore
  import Tags from 'svelte-tags-input';
  import { liveQuery } from 'dexie';
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';

  import { selectedNode } from '@/lib/store';
  import { NodeType, EditorState } from '@/utils/const';
  import { graphDB, type CustomNodeObject, type Node } from '@/lib/graph-db';
  import { TwoWayMap } from '@/lib/utils';

  const getEditorStatus = (node: CustomNodeObject | null): EditorState => {
    if (node == null) return EditorState.NoWordSelected;
    else if (node.id == '') return EditorState.NewWordCreated;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  let currentEditorState: EditorState = getEditorStatus($selectedNode);
  $: currentEditorState = getEditorStatus($selectedNode);

  let editorStatusText: string;
  $: {
    switch(currentEditorState) {
    case EditorState.NoWordSelected:
      editorStatusText = 'Try to search a word or select in graph'; break;
    case EditorState.NewWordCreated:
      editorStatusText = `New word: ${ $selectedNode!.text }`; break;
    case EditorState.WordSelected:
      editorStatusText = `Word: ${ $selectedNode!.text }`; break;
    case EditorState.NonWordSelected:
      editorStatusText = `${$selectedNode!.type?.toUpperCase()}: ${ $selectedNode!.text }`; break;
    default: break;
    }
  }

  let languageNodeMap: TwoWayMap = new Map();
  let languageChoices = liveQuery(async () => {
    const nodes = await graphDB.getAllNodesByType(NodeType.Language);
    languageNodeMap = new TwoWayMap(nodes.map(node => [node.id, node.text]));
    return nodes;
  });
  let languageSelected: string[] = [];


  let POSNodeMap: TwoWayMap = new Map();
  let POSChoices = liveQuery(async () => {
    const nodes = await graphDB.getAllNodesByType(NodeType.POS);
    POSNodeMap = new TwoWayMap(nodes.map(node => [node.id, node.text]));
    return nodes;
  });
  let POSSelected: string[] = [];

  let connectedNodes: Node[] = [];
  const setSelectedTags = async (nodeId: string) => {
    connectedNodes = await graphDB.getAllConnectionByNodeId(nodeId);
    languageSelected = connectedNodes
      .filter(node => node.type == NodeType.Language)
      .map(node => node.text);
    POSSelected = connectedNodes
      .filter(node => node.type == NodeType.POS)
      .map(node => node.text);
  };
  const resetSelected = () => {
    connectedNodes = [];
    languageSelected = [];
    POSSelected = [];
  };

  $: if (currentEditorState == EditorState.WordSelected && $selectedNode) {
    setSelectedTags($selectedNode.id as string);
  } else {
    resetSelected();
  }

  let wordNote: string = $selectedNode?.property?.note ?? '';
  const updateWordNote = debounce(async (nodeId: string) => {
    await graphDB.updateWordNoteById(nodeId, wordNote);
  }, 200, { trailing: true, maxWait: 500 });
  // const noteChangeHandler = (ev: InputEvent) => {
  //   console.log(ev.target.value);
  // };

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
      <Tags
        tags={languageSelected}
        autoComplete={$languageChoices.filter(({ text }) => !languageSelected.includes(text))}
        autoCompleteKey={'text'}
        onlyAutocomplete onlyUnique
      />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Part of speech</span>
      <Tags tags={POSSelected}
        autoComplete={$POSChoices.filter(({ text }) => !POSSelected.includes(text))}
        autoCompleteKey={'text'}
        onlyAutocomplete onlyUnique
      />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Means</span>
      <Tags tags={[]} />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Note</span>
      <input type="text" bind:value={wordNote}>
    </div>

    {#if currentEditorState == EditorState.NewWordCreated}
      <div class="flex">
        <button class="btn btn-success">
          Save
        </button>
      </div>
    {/if}
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
  :global(.svelte-tags-input-matchs-parent li){
    @apply bg-zinc-800;
  }
}

</style>