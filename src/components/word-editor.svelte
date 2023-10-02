<script lang='ts'>
  import { liveQuery } from 'dexie';

  import TagsInput from '@/components/tags-input.svelte';
  import WordNote from '@/components/word-note.svelte';
  import EditorLabel from '@/components/editor-label.svelte';
  import ConfirmDialog from '@/components/confirm-dialog.svelte';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { queryNodeByText, allWordIndex, allRomanIndex } from '@/lib/search';
  import { NodeType, EditorState, EdgeType } from '@/utils/const';
  import { graphDB, wordDB } from '@/lib/graph-db';
  import type { Node, CustomNodeObject, LinkedNode } from '@/lib/graph-db';
  import { nodeSortFn } from '@/lib/utils';

  const getEditorStatus = (node?: CustomNodeObject): EditorState => {
    if (!node) return EditorState.NoWordSelected;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  $: currentEditorState = getEditorStatus($selectedNode);
  $: isAllowDelete = [NodeType.Word, NodeType.Roman].includes($selectedNode?.type as NodeType);

  $: connectedNodes$ = liveQuery<LinkedNode[]>(async () => {
    if (currentEditorState == EditorState.WordSelected && $selectedNodeId != null) {
      return await graphDB.getNeighborsNodesByNodeId($selectedNodeId);
    } else if (currentEditorState == EditorState.NonWordSelected && $selectedNodeId != null) {
      return await graphDB.getSourceNodesFromTargetNode($selectedNodeId) as LinkedNode[];
    }
    return [];
  });
  $: languageSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Language).sort(nodeSortFn) : [];
  $: POSSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.POS).sort(nodeSortFn) : [];
  $: wordsSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Word).sort(nodeSortFn) : [];
  $: romanSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Roman).sort(nodeSortFn) : [];

  const meaningChoiceFn = async (queryText: string): Promise<Node[]> => {
    if (queryText == '' && $selectedNodeId) {
      // if no query text then return connected nodes' neighbor for suggestion
      return await graphDB.getSecondDegreeWordNeighbors($selectedNodeId);
    }

    return queryNodeByText(queryText, allWordIndex, {
      limit: 10,
      excludeNodesId: [...wordsSelected.map(node => node.id), $selectedNodeId ?? '']
    })
      .filter(node => node.id != $selectedNodeId)
      .map(node => ({ ...node, showText: node.text }));
  };

  const romanChoiceFn = async (queryText: string): Promise<Node[]> => {
    return queryNodeByText(queryText, allRomanIndex, {
      limit: 10,
      excludeNodesId: [...romanSelected.map(node => node.id), $selectedNodeId ?? '']
    })
      .filter(node => node.id != $selectedNodeId)
      .map(node => ({ ...node, showText: node.text }));
  };


  const linkNodeHandler = (edgeType: EdgeType, nodeType: NodeType, isTwoWay = false) => async (toLinkNode: Node) => {
    if ($selectedNodeId) {
      if (toLinkNode.id == '') {
        const newNode = await graphDB.createNewNode(nodeType, toLinkNode.text);
        await graphDB.createNewEdge(edgeType, $selectedNodeId!, newNode.id);
        if (isTwoWay) await graphDB.createNewEdge(edgeType, newNode.id, $selectedNodeId!);
      } else {
        await graphDB.createNewEdge(edgeType, $selectedNodeId!, toLinkNode.id);
        if (isTwoWay) await graphDB.createNewEdge(edgeType, toLinkNode.id, $selectedNodeId!);
      }
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  const delete1WayLinkHandler = async (linkedNode: LinkedNode) => {
    if ($selectedNode) {
      await graphDB.deleteEdge(linkedNode.linkedEdgeId);
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  const delete2WayLinkHandler = async (removedNode: Node) => {
    if ($selectedNodeId) {
      await Promise.all([
        graphDB.deleteEdgeByNodesId($selectedNodeId!, removedNode.id),
        graphDB.deleteEdgeByNodesId(removedNode.id, $selectedNodeId!),
      ]);
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  let openDialog: () => void;
  const deleteWordHandler = async () => {
    const toDeleteNodeId = $selectedNodeId ?? '';
    selectedNode.set(undefined);
    await graphDB.deleteNodeAndConnectedEdges(toDeleteNodeId);
    if ($selectedNode?.type == NodeType.Word)
      await wordDB.deleteWordNoteById(toDeleteNodeId);
  };

  // eslint-disable-next-line no-control-regex
  $: isExceedLatin = !/^[\x00-\xFF]*$/.test($selectedNode?.text ?? 'a');

</script>

<div class="w-full flex justify-center">
  <EditorLabel
    currentEditorState={currentEditorState}
  />
</div>


{#if currentEditorState == EditorState.WordSelected}
  <div class="flex flex-col border border-zinc-700 rounded-sm px-4 pb-6">
    <TagsInput bind:selectedTags={languageSelected}
      inputLabel={'Language'} tagType={NodeType.Language}
      addingCallback={linkNodeHandler(EdgeType.IsLanguage, NodeType.Language)}
      deletingCallback={delete1WayLinkHandler}
    />

    <TagsInput selectedTags={POSSelected}
      inputLabel={'Part of speech'} tagType={NodeType.POS}
      addingCallback={linkNodeHandler(EdgeType.IsPOS, NodeType.POS)}
      deletingCallback={delete1WayLinkHandler}
    />

    <TagsInput selectedTags={wordsSelected}
      inputLabel={'Meaning'} tagType={NodeType.Word}
      allowCreateNode allowTagClick
      choiceFunction={meaningChoiceFn}
      addingCallback={linkNodeHandler(EdgeType.Means, NodeType.Word, true)}
      deletingCallback={delete2WayLinkHandler}
      minimumChars={0}
    />

    {#if isExceedLatin}
      <TagsInput selectedTags={romanSelected}
        inputLabel={'Romanization'} tagType={NodeType.Roman}
        allowCreateNode allowTagClick
        choiceFunction={romanChoiceFn}
        addingCallback={linkNodeHandler(EdgeType.Romanization, NodeType.Roman)}
        deletingCallback={delete1WayLinkHandler}
      />
    {/if}

    <div class="collapse collapse-arrow mb-2">
      <input type="checkbox" />
      <div class="collapse-title">
        Click to open note
      </div>
      <div class="collapse-content">
        <WordNote />
      </div>
    </div>

    {#if isAllowDelete}
      <div class="flex">
        <button class="btn btn-error" on:click={openDialog}>
          Delete
        </button>
      </div>
    {/if}
  </div>
{:else if currentEditorState == EditorState.NonWordSelected}
<div class="flex flex-col border border-zinc-700 rounded-sm px-4 pb-6">
  <TagsInput selectedTags={wordsSelected}
    inputLabel={'Word'} tagType={NodeType.Word}
    allowTagClick disableInput disableDelete
  />
</div>
{/if}


<ConfirmDialog bind:open={openDialog}
  onConfirmCallback={deleteWordHandler}
/>
