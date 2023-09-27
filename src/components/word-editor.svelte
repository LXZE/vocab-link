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

  $: connectedNodes$ = liveQuery<LinkedNode[]>(async () => {
    if (currentEditorState == EditorState.WordSelected && $selectedNodeId != null) {
      return await graphDB.getAllConnectionByNodeId($selectedNodeId);
    }
    return [];
  });
  $: languageSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Language).sort(nodeSortFn) : [];
  $: POSSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.POS).sort(nodeSortFn) : [];
  $: meansSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Word).sort(nodeSortFn) : [];
  $: romanSelected = $connectedNodes$ ? $connectedNodes$.filter(node => node.type == NodeType.Roman).sort(nodeSortFn) : [];

  const link1WayNodeHandler = (edgeType: EdgeType, nodeType: NodeType) => async (toLinkNode: Node) => {
    if ($selectedNodeId) {
      if (toLinkNode.id == '') {
        const newNode = await graphDB.createNewNode(nodeType, toLinkNode.text);
        await graphDB.createNewEdge(edgeType, $selectedNodeId, newNode.id);
      } else {
        await graphDB.createNewEdge(edgeType, $selectedNodeId, toLinkNode.id);
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

  const meaningChoiceFn = async (queryText: string): Promise<Node[]> => {
    if (queryText == '' && $selectedNodeId) {
      // if no query text then return connected nodes' neighbor for suggestion
      return await graphDB.getSecondDegreeWordNeighbors($selectedNodeId);
    }

    return queryNodeByText(queryText, allWordIndex, {
      limit: 10,
      excludeWordsId: [...meansSelected.map(node => node.id), $selectedNodeId ?? '']
    })
      .filter(node => node.id != $selectedNodeId)
      .map(node => ({ ...node, showText: node.text }));
  };

  const romanChoiceFn = async (queryText: string): Promise<Node[]> => {
    return queryNodeByText(queryText, allRomanIndex, {
      limit: 10,
      excludeWordsId: [...romanSelected.map(node => node.id), $selectedNodeId ?? '']
    })
      .filter(node => node.id != $selectedNodeId)
      .map(node => ({ ...node, showText: node.text }));
  };

  const addWordConnHandler = async (toLinkNode: Node | LinkedNode) => {
    if ($selectedNodeId) {
      if (toLinkNode.id == '') {
        const newNode = await graphDB.createNewNode(NodeType.Word, toLinkNode.text);
        await Promise.all([
          graphDB.createNewEdge(EdgeType.Means, $selectedNodeId, newNode.id),
          graphDB.createNewEdge(EdgeType.Means, newNode.id, $selectedNodeId),
        ]);
      } else {
        await Promise.all([
          graphDB.createNewEdge(EdgeType.Means, $selectedNodeId, toLinkNode.id),
          graphDB.createNewEdge(EdgeType.Means, toLinkNode.id, $selectedNodeId),
        ]);
      }
      $selectedNode = $selectedNode; // trigger graph
    }
  };
  const delete2WayLinkHandler = async (removedNode: Node) => {
    if ($selectedNodeId) {
      await Promise.all([
        graphDB.deleteEdgeByNodesId($selectedNodeId, removedNode.id),
        graphDB.deleteEdgeByNodesId(removedNode.id, $selectedNodeId),
      ]);
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  let openDialog: () => void;
  const deleteWordHandler = async () => {
    const toDeleteNodeId = $selectedNodeId ?? '';
    selectedNode.set(undefined);
    await graphDB.deleteNodeAndConnectedEdges(toDeleteNodeId);
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


<div class="flex flex-col">
  {#if currentEditorState == EditorState.WordSelected}
    <TagsInput bind:selectedTags={languageSelected}
      inputLabel={'Language'} tagType={NodeType.Language}
      addingCallback={link1WayNodeHandler(EdgeType.IsLanguage, NodeType.Language)}
      deletingCallback={delete1WayLinkHandler}
    />

    <TagsInput selectedTags={POSSelected}
      inputLabel={'Part of speech'} tagType={NodeType.POS}
      addingCallback={link1WayNodeHandler(EdgeType.IsPOS, NodeType.POS)}
      deletingCallback={delete1WayLinkHandler}
    />

    <TagsInput selectedTags={meansSelected}
      inputLabel={'Meaning'} tagType={NodeType.Word}
      allowCreateNode allowTagClick
      choiceFunction={meaningChoiceFn}
      addingCallback={addWordConnHandler}
      deletingCallback={delete2WayLinkHandler}
      minimumChars={0}
    />

    {#if isExceedLatin}
      <TagsInput selectedTags={romanSelected}
        inputLabel={'Romanization'} tagType={NodeType.Roman}
        allowCreateNode choiceFunction={romanChoiceFn}
        addingCallback={link1WayNodeHandler(EdgeType.Romanization, NodeType.Roman)}
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
