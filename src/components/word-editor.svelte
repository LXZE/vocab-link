<script lang='ts'>
  import { liveQuery } from 'dexie';

  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';

  import TagsInput from '@/components/tags-input.svelte';
  import WordNote from '@/components/word-note.svelte';

  import { selectedNode } from '@/lib/store';
  import { NodeType, EditorState, EdgeType } from '@/utils/const';
  import { graphDB } from '@/lib/graph-db';
  import type { Node, CustomNodeObject, TargetNode } from '@/lib/graph-db';
    import { nodeSortFn } from '@/lib/utils';

  const getEditorStatus = (node: CustomNodeObject | null): EditorState => {
    if (node == null) return EditorState.NoWordSelected;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  $: currentEditorState = getEditorStatus($selectedNode);

  let editorStatusText: string;
  $: {
    switch(currentEditorState) {
    case EditorState.NoWordSelected:
      editorStatusText = 'Try to search a word or select in graph'; break;
    case EditorState.WordSelected:
      editorStatusText = `Word: ${ $selectedNode!.text }`; break;
    case EditorState.NonWordSelected:
      editorStatusText = `${$selectedNode!.type?.toUpperCase()}: ${ $selectedNode!.text }`; break;
    default: break;
    }
  }

  $: connectedNodes = liveQuery<TargetNode[]>(async () => {
    if (currentEditorState == EditorState.WordSelected && $selectedNode != null) {
      return await graphDB.getAllConnectionByNodeId($selectedNode.id as string);
    }
    return [];
  });
  $: languageSelected = $connectedNodes ? $connectedNodes.filter(node => node.type == NodeType.Language).sort(nodeSortFn) : [];
  $: POSSelected = $connectedNodes ? $connectedNodes.filter(node => node.type == NodeType.POS).sort(nodeSortFn) : [];

  const createAddTagHandler = (edgeType: EdgeType) => async (targetNode: Node) => {
    if ($selectedNode) {
      await graphDB.createNewEdge(edgeType, $selectedNode?.id as string, targetNode.id);
      $selectedNode = $selectedNode; // trigger graph
    }
  };
  const deleteTagHandler = async (targetNode: TargetNode) => {
    if ($selectedNode) {
      await graphDB.deleteEdge(targetNode.linkedEdgeId);
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  const deleteWordHandler = async () => {
    let isConfirm = confirm('All connection and word will be deleted, confirm?');
    if (isConfirm) {
      const toDeleteNodeId = ($selectedNode?.id ?? '') as string;
      selectedNode.set(null);
      graphDB.deleteNodeAndConnectedEdges(toDeleteNodeId);
      graphDB.deleteWordNoteById(toDeleteNodeId);
    }
  };

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

  {#if currentEditorState == EditorState.WordSelected}
    <TagsInput bind:selectedTags={languageSelected}
      label={'Language'} tagType={NodeType.Language}
      addingCallback={createAddTagHandler(EdgeType.IsLanguage)}
      deletingCallback={deleteTagHandler}
    />

    <TagsInput selectedTags={POSSelected}
      label={'Part of speech'} tagType={NodeType.POS}
      addingCallback={createAddTagHandler(EdgeType.IsPOS)}
      deletingCallback={deleteTagHandler}
    />

    <!-- <div class='flex flex-col gap-2 my-2'>
      <span>Means</span>
      <Tags tags={[]} />
    </div> -->
    <WordNote />


    {#if currentEditorState == EditorState.WordSelected}
      <div class="flex">
        <button class="btn btn-error" on:click={deleteWordHandler}>
          Delete
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