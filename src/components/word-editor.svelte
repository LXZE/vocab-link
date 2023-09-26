<script lang='ts'>
  import { liveQuery } from 'dexie';

  import TagsInput from '@/components/tags-input.svelte';
  import WordNote from '@/components/word-note.svelte';
  import EditorLabel from '@/components/editor-label.svelte';
  import ConfirmDialog from '@/components/confirm-dialog.svelte';

  import { queryNodeByText, selectedNode, selectedNodeId } from '@/lib/store';
  import { NodeType, EditorState, EdgeType } from '@/utils/const';
  import { graphDB } from '@/lib/graph-db';
  import type { Node, CustomNodeObject, TargetNode } from '@/lib/graph-db';
  import { nodeSortFn } from '@/lib/utils';

  const getEditorStatus = (node?: CustomNodeObject): EditorState => {
    if (!node) return EditorState.NoWordSelected;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  $: currentEditorState = getEditorStatus($selectedNode);

  $: connectedNodes$ = liveQuery<TargetNode[]>(async () => {
    if (currentEditorState == EditorState.WordSelected && $selectedNodeId != null) {
      return await graphDB.getAllConnectionByNodeId($selectedNodeId);
    }
    return [];
  });
  $: languageSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Language).sort(nodeSortFn) : [];
  $: POSSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.POS).sort(nodeSortFn) : [];
  $: meansSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Word).sort(nodeSortFn) : [];

  const createAddTagHandler = (edgeType: EdgeType) => async (targetNode: Node) => {
    if ($selectedNodeId) {
      await graphDB.createNewEdge(edgeType, $selectedNodeId, targetNode.id);
      $selectedNode = $selectedNode; // trigger graph
    }
  };
  const deleteTagHandler = async (targetNode: TargetNode) => {
    if ($selectedNode) {
      await graphDB.deleteEdge(targetNode.linkedEdgeId);
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  const choiceFn = async (queryText: string): Promise<Node[]> => {
    if (queryText == '' && $selectedNodeId) {
      // if no query text then return connected nodes' neighbor for suggestion
      return await graphDB.getSecondDegreeWordNeighbors($selectedNodeId);
    }

    return queryNodeByText(queryText, {
      limit: 10,
      excludeWordsId: [...meansSelected.map(node => node.id), $selectedNodeId ?? '']
    })
      .filter(node => node.id != $selectedNodeId)
      .map(node => ({ ...node, showText: node.text }));
  };

  const addWordHandler = async (targetNode: Node | TargetNode) => {
    if ($selectedNodeId) {
      if (targetNode.id == '') {
        const newWord = await graphDB.createNewNode(NodeType.Word, targetNode.text);
        await Promise.all([
          graphDB.createNewEdge(EdgeType.Means, $selectedNodeId, newWord.id),
          graphDB.createNewEdge(EdgeType.Means, newWord.id, $selectedNodeId),
        ]);
      } else {
        await Promise.all([
          graphDB.createNewEdge(EdgeType.Means, $selectedNodeId, targetNode.id),
          graphDB.createNewEdge(EdgeType.Means, targetNode.id, $selectedNodeId),
        ]);
      }
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  let openDialog: () => void;
  const deleteWordHandler = async () => {
    const toDeleteNodeId = $selectedNodeId ?? '';
    selectedNode.set(undefined);
    await graphDB.deleteNodeAndConnectedEdges(toDeleteNodeId);
    await graphDB.deleteWordNoteById(toDeleteNodeId);
  };

</script>

<div class="flex flex-col override-default-tags">
  <EditorLabel
    currentEditorState={currentEditorState}
  />

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

    <TagsInput selectedTags={meansSelected}
      isAllowCreate
      choiceFunction={choiceFn}
      label={'Meaning'} tagType={NodeType.Word}
      addingCallback={addWordHandler}
      deletingCallback={deleteTagHandler}
    />

    <WordNote />

    <div class="flex">
      <button class="btn btn-error" on:click={openDialog}>
        Delete
      </button>
    </div>
  {/if}

</div>

<ConfirmDialog bind:open={openDialog}
  onConfirmCallback={deleteWordHandler}
/>


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