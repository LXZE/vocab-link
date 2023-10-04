<script lang='ts'>
  import { liveQuery } from 'dexie';

  import TagsInput from '@/components/tags-input.svelte';
  import WordNote from '@/components/word-note.svelte';
  import EditorLabel from '@/components/editor-label.svelte';
  import ConfirmDialog from '@/components/confirm-dialog.svelte';
  import WordForm from '@/components/word-form.svelte';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { queryNodeByText, allWordIndex, allRomanIndex, type IndexedNode } from '@/lib/search';
  import { NodeType, EditorState, EdgeType } from '@/utils/const';
  import { graphDB, wordDB } from '@/lib/graph-db';
  import type { Node, CustomNodeObject, LinkedNode } from '@/lib/graph-db';
  import { nodeSortFn, normalizeWord } from '@/lib/utils';

  const getEditorStatus = (node?: CustomNodeObject): EditorState => {
    if (!node) return EditorState.NoWordSelected;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  $: currentEditorState = getEditorStatus($selectedNode);
  $: isAllowDelete = [NodeType.Word, NodeType.Roman].includes($selectedNode?.type as NodeType);

  $: connectedNodes$ = liveQuery<LinkedNode[]>(async () => {
    if (currentEditorState == EditorState.WordSelected && $selectedNodeId)
      return await graphDB.getNeighborsNodesByNodeId($selectedNodeId);
    if (currentEditorState == EditorState.NonWordSelected && $selectedNodeId)
      return await graphDB.getNeighborsNodesByNodeId($selectedNodeId, 'target');
    return [];
  });

  // get selected tags
  const filterLinkedNodes = (filterFunction: (_: LinkedNode) => boolean) => $connectedNodes$
    .filter(filterFunction).sort(nodeSortFn);
  const languageFilterFn = (node: LinkedNode) => node.type == NodeType.Language;
  const POSFilterFn = (node: LinkedNode) => node.type == NodeType.POS;
  const meaningFilterFn = (node: LinkedNode) => node.type == NodeType.Word && node.edgeType == EdgeType.Means;
  const antonymFilterFn = (node: LinkedNode) => node.type == NodeType.Word && node.edgeType == EdgeType.Antonym;
  const formsFilterFn = (node: LinkedNode) => node.type == NodeType.Word && node.edgeType == EdgeType.IsForm;
  const romanFilterFn = (node: LinkedNode) => node.type == NodeType.Roman;
  $: languageSelected = $connectedNodes$ ? filterLinkedNodes(languageFilterFn) : [];
  $: POSSelected = $connectedNodes$ ? filterLinkedNodes(POSFilterFn) : [];
  $: meaningSelected = $connectedNodes$ ? filterLinkedNodes(meaningFilterFn) : [];
  $: antonymSelected = $connectedNodes$ ? filterLinkedNodes(antonymFilterFn) : [];
  $: formsSelected = $connectedNodes$ ? filterLinkedNodes(formsFilterFn) : [];
  $: romanSelected = $connectedNodes$ ? filterLinkedNodes(romanFilterFn) : [];

  // suggestion  function
  const queryNodes = async (queryText: string, preparedIndexes: IndexedNode[]): Promise<Node[]> => {
    return queryNodeByText(queryText, preparedIndexes, {
      limit: 10,
      excludeNodesId: [...meaningSelected.map(node => node.id), $selectedNodeId ?? '']
    });
  };
  const meaningChoiceFn = async (queryText: string): Promise<Node[]> => {
    // if no query text then return connected nodes' neighbor for suggestion
    if (queryText == '' && $selectedNodeId)
      return await graphDB.getSecondDegreeWordNeighbors($selectedNodeId);
    return queryNodes(queryText, allWordIndex);
  };

  const linkNodeHandler = (
    edgeType: EdgeType, nodeType: NodeType,
    direction: 'one-way' | 'two-way' = 'one-way'
  ) => async (toLinkNode: Node) => {
    if ($selectedNodeId) {
      if (toLinkNode.id == '') {
        const newNode = await graphDB.createNewNode(nodeType, normalizeWord(toLinkNode.text));
        await graphDB.createNewEdge(edgeType, $selectedNodeId, newNode.id);
        if (direction == 'two-way') await graphDB.createNewEdge(edgeType, newNode.id, $selectedNodeId);
      } else {
        await graphDB.createNewEdge(edgeType, $selectedNodeId, toLinkNode.id);
        if (direction == 'two-way') await graphDB.createNewEdge(edgeType, toLinkNode.id, $selectedNodeId);
      }
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  const deleteLinkHandler = (
    direction: 'one-way' | 'two-way' = 'one-way'
  ) => async (linkedNode: LinkedNode | number) => {
    if (typeof linkedNode === 'number') return; // if return index of tag, do nothing
    if ($selectedNodeId) {
      if (direction == 'one-way')
        await graphDB.deleteEdge(linkedNode.linkedEdgeId);
      else {
        await Promise.all([
          graphDB.deleteEdgeByNodesId($selectedNodeId, linkedNode.id),
          graphDB.deleteEdgeByNodesId(linkedNode.id, $selectedNodeId),
        ]);
      }
      $selectedNode = $selectedNode; // trigger graph
    }
  };

  const tagClickHandler = (clickedNode: Node) => {
    selectedNode.set(clickedNode);
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


{#if currentEditorState == EditorState.WordSelected && $selectedNode}
  <div class="flex flex-col border border-zinc-700 rounded-sm px-4 pb-6">
    <TagsInput bind:selectedTags={languageSelected}
      inputLabel={'Language'} tagType={NodeType.Language}
      allowTagClick clickTagCallback={tagClickHandler}
      addingCallback={linkNodeHandler(EdgeType.IsLanguage, NodeType.Language)}
      deletingCallback={deleteLinkHandler()}
    />

    <TagsInput selectedTags={POSSelected}
      inputLabel={'Part of speech'} tagType={NodeType.POS}
      allowTagClick clickTagCallback={tagClickHandler}
      addingCallback={linkNodeHandler(EdgeType.IsPOS, NodeType.POS)}
      deletingCallback={deleteLinkHandler()}
    />

    <TagsInput selectedTags={meaningSelected}
      inputLabel={'Meaning'} tagType={NodeType.Word}
      allowCreateNode
      allowTagClick clickTagCallback={tagClickHandler}
      choiceFunction={meaningChoiceFn}
      addingCallback={linkNodeHandler(EdgeType.Means, NodeType.Word, 'two-way')}
      deletingCallback={deleteLinkHandler('two-way')}
      minimumChars={0}
    />

    <TagsInput selectedTags={antonymSelected}
      inputLabel={'Antonym'} tagType={NodeType.Word}
      allowCreateNode
      allowTagClick clickTagCallback={tagClickHandler}
      choiceFunction={(queryText) => queryNodes(queryText, allWordIndex)}
      addingCallback={linkNodeHandler(EdgeType.Antonym, NodeType.Word, 'two-way')}
      deletingCallback={deleteLinkHandler('two-way')}
      minimumChars={0}
    />

    {#if isExceedLatin}
      <TagsInput selectedTags={romanSelected}
        inputLabel={'Romanization'} tagType={NodeType.Roman}
        allowCreateNode
        allowTagClick clickTagCallback={tagClickHandler}
        choiceFunction={(queryText) => queryNodes(queryText, allRomanIndex)}
        addingCallback={linkNodeHandler(EdgeType.Romanization, NodeType.Roman)}
        deletingCallback={deleteLinkHandler()}
      />
    {/if}

    <WordForm formsSelected={formsSelected} />

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
  <TagsInput selectedTags={$connectedNodes$}
    inputLabel={'Word'} tagType={NodeType.Word}
    allowTagClick clickTagCallback={tagClickHandler}
    disableInput disableRemoveTag
  />

  {#if isAllowDelete}
    <div class="flex">
      <button class="btn btn-error" on:click={openDialog}>
        Delete
      </button>
    </div>
  {/if}
</div>
{/if}


<ConfirmDialog bind:open={openDialog}
  onConfirmCallback={deleteWordHandler}
/>
