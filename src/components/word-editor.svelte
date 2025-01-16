<script lang="ts">
  import { fromStore } from "svelte/store";
  import { liveQuery } from "dexie";

  import TagsInput from "@/components/tags-input.svelte";
  import WordNote from "@/components/word-note.svelte";
  import EditorLabel from "@/components/editor-label.svelte";
  import ConfirmDialog from "@/components/confirm-dialog.svelte";
  import WordForm from "@/components/word-form.svelte";

  import { selectedNode, selectedNodeId } from "@/lib/store";
  import {
    queryNodeByText,
    allWordIndex,
    allRomanIndex,
    type IndexedNode,
  } from "@/lib/search";
  import { NodeType, EditorState, EdgeType } from "@/utils/const";
  import { graphDB, wordDB } from "@/lib/graph-db";
  import type { Node, CustomNodeObject, LinkedNode } from "@/lib/graph-db";
  import { nodeSortFn, normalizeWord } from "@/lib/utils";

  const ALLOW_DELETE_NODE_TYPES = [NodeType.Word, NodeType.Roman];

  const getEditorStatus = (node?: CustomNodeObject): EditorState => {
    if (!node) return EditorState.NoWordSelected;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  let currentEditorState = $derived(getEditorStatus($selectedNode));
  let isAllowDelete = $derived(
    ALLOW_DELETE_NODE_TYPES.includes($selectedNode?.type as NodeType)
  );

  function stateQuery<T>(
    query_fn: () => T | Promise<T>,
    dependencies: () => unknown[]
  ): { current?: T } {
    const query = $state<{ current?: T }>({ current: undefined });
    $effect(() => {
      dependencies?.();
      return liveQuery(query_fn).subscribe((result) => {
        if (result !== undefined) {
          query.current = result;
        }
      }).unsubscribe;
    });
    return query;
  }

  const connectedNodes = stateQuery<LinkedNode[]>(
    async () => {
      if ($selectedNodeId != undefined) {
        if (currentEditorState == EditorState.WordSelected)
          return await graphDB.getNeighborsNodesByNodeId($selectedNodeId);
        if (currentEditorState == EditorState.NonWordSelected)
          return await graphDB.getNeighborsNodesByNodeId(
            $selectedNodeId,
            "target"
          );
      }
      return [];
    },
    () => [$selectedNodeId]
  );
  let connectedNodes$ = $derived(connectedNodes.current ?? []);

  // get selected tags
  const filterLinkedNodes = (
    nodes: LinkedNode[],
    filterFunction: (_: LinkedNode) => boolean
  ) => nodes.filter(filterFunction).sort(nodeSortFn);
  const languageFilterFn = (node: LinkedNode) => node.type == NodeType.Language;
  const POSFilterFn = (node: LinkedNode) => node.type == NodeType.POS;
  const meaningFilterFn = (node: LinkedNode) =>
    node.type == NodeType.Word && node.edgeType == EdgeType.Means;
  const antonymFilterFn = (node: LinkedNode) =>
    node.type == NodeType.Word && node.edgeType == EdgeType.Antonym;
  const formsFilterFn = (node: LinkedNode) =>
    node.type == NodeType.Word && node.edgeType == EdgeType.IsForm;
  const romanFilterFn = (node: LinkedNode) => node.type == NodeType.Roman;
  const selectedLanguage = $derived(
    filterLinkedNodes(connectedNodes$, languageFilterFn)
  );
  const selectedPOS = $derived(filterLinkedNodes(connectedNodes$, POSFilterFn));
  const selectedMeaning = $derived(
    filterLinkedNodes(connectedNodes$, meaningFilterFn)
  );
  const selectedAntonym = $derived(
    filterLinkedNodes(connectedNodes$, antonymFilterFn)
  );
  const selectedForms = $derived(
    filterLinkedNodes(connectedNodes$, formsFilterFn)
  );
  const selectedRoman = $derived(
    filterLinkedNodes(connectedNodes$, romanFilterFn)
  );

  // suggestion function
  const queryNodes = async (
    queryText: string,
    preparedIndexes: IndexedNode[]
  ): Promise<Node[]> => {
    return queryNodeByText(queryText, preparedIndexes, {
      limit: 10,
      excludeNodesId: [
        ...selectedMeaning.map((node) => node.id),
        $selectedNodeId ?? "",
      ],
    });
  };
  const meaningChoiceFn = async (queryText: string): Promise<Node[]> => {
    // if no query text then return connected nodes' neighbor for suggestion
    if (queryText == "" && $selectedNodeId)
      return await graphDB.getSecondDegreeWordNeighbors($selectedNodeId);
    return queryNodes(queryText, allWordIndex);
  };

  const linkNodeHandler =
    (
      edgeType: EdgeType,
      nodeType: NodeType,
      direction: "one-way" | "two-way" = "one-way"
    ) =>
    async (toLinkNode: Node) => {
      if ($selectedNodeId) {
        if (toLinkNode.id == "") {
          const newNode = await graphDB.createNewNode(
            nodeType,
            normalizeWord(toLinkNode.text)
          );
          await graphDB.createNewEdge(edgeType, $selectedNodeId, newNode.id);
          if (direction == "two-way")
            await graphDB.createNewEdge(edgeType, newNode.id, $selectedNodeId);
        } else {
          await graphDB.createNewEdge(edgeType, $selectedNodeId, toLinkNode.id);
          if (direction == "two-way")
            await graphDB.createNewEdge(
              edgeType,
              toLinkNode.id,
              $selectedNodeId
            );
        }
        $selectedNode = $selectedNode; // trigger graph
      }
    };

  const deleteLinkHandler =
    (direction: "one-way" | "two-way" = "one-way") =>
    async (linkedNode: LinkedNode | number) => {
      if (typeof linkedNode === "number") return; // if return index of tag, do nothing
      if ($selectedNodeId) {
        if (direction == "one-way")
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

  let confirmDialog: ConfirmDialog;
  const deleteWordHandler = async () => {
    const toDeleteNodeId = $selectedNodeId ?? "";
    selectedNode.set(undefined);
    await graphDB.deleteNodeAndConnectedEdges(toDeleteNodeId);
    if ($selectedNode?.type == NodeType.Word)
      await wordDB.deleteWordNoteById(toDeleteNodeId);
  };

  // eslint-disable-next-line no-control-regex
  let isExceedLatin = $derived(
    !/^[\x00-\xFF]*$/.test($selectedNode?.text ?? "a")
  );
</script>

<div class="w-full flex justify-center">
  <EditorLabel {currentEditorState} />
</div>

{#if currentEditorState == EditorState.WordSelected && $selectedNode}
  <div class="flex flex-col border border-zinc-700 rounded-sm px-4 pb-6">
    <TagsInput
      selectedTags={selectedLanguage}
      inputLabel={"Language"}
      tagType={NodeType.Language}
      allowTagClick
      clickTagCallback={tagClickHandler}
      addingCallback={linkNodeHandler(EdgeType.IsLanguage, NodeType.Language)}
      deletingCallback={deleteLinkHandler()}
    />

    <TagsInput
      selectedTags={selectedPOS}
      inputLabel={"Part of speech"}
      tagType={NodeType.POS}
      allowTagClick
      clickTagCallback={tagClickHandler}
      addingCallback={linkNodeHandler(EdgeType.IsPOS, NodeType.POS)}
      deletingCallback={deleteLinkHandler()}
    />

    <TagsInput
      selectedTags={selectedMeaning}
      inputLabel={"Meaning"}
      tagType={NodeType.Word}
      allowCreateNode
      allowTagClick
      clickTagCallback={tagClickHandler}
      choiceFunction={meaningChoiceFn}
      addingCallback={linkNodeHandler(EdgeType.Means, NodeType.Word, "two-way")}
      deletingCallback={deleteLinkHandler("two-way")}
      minimumChars={0}
    />

    <TagsInput
      selectedTags={selectedAntonym}
      inputLabel={"Antonym"}
      tagType={NodeType.Word}
      allowCreateNode
      allowTagClick
      clickTagCallback={tagClickHandler}
      choiceFunction={(queryText) => queryNodes(queryText, allWordIndex)}
      addingCallback={linkNodeHandler(
        EdgeType.Antonym,
        NodeType.Word,
        "two-way"
      )}
      deletingCallback={deleteLinkHandler("two-way")}
      minimumChars={0}
    />

    {#if isExceedLatin}
      <TagsInput
        selectedTags={selectedRoman}
        inputLabel={"Romanization"}
        tagType={NodeType.Roman}
        allowCreateNode
        allowTagClick
        clickTagCallback={tagClickHandler}
        choiceFunction={(queryText) => queryNodes(queryText, allRomanIndex)}
        addingCallback={linkNodeHandler(EdgeType.Romanization, NodeType.Roman)}
        deletingCallback={deleteLinkHandler()}
      />
    {/if}

    <!-- <WordForm {selectedForms} /> -->

    <WordNote selectedNodeId={$selectedNodeId} />

    {#if isAllowDelete}
      <div class="flex">
        <button class="btn btn-error" onclick={() => confirmDialog.open()}>
          Delete
        </button>
      </div>
    {/if}
  </div>
{:else if currentEditorState == EditorState.NonWordSelected}
  <div class="flex flex-col border border-zinc-700 rounded-sm px-4 pb-6">
    <TagsInput
      selectedTags={connectedNodes$}
      inputLabel={"Word"}
      tagType={NodeType.Word}
      allowTagClick
      clickTagCallback={tagClickHandler}
      disableInput
      disableRemoveTag
    />

    {#if isAllowDelete}
      <div class="flex">
        <button class="btn btn-error" onclick={() => confirmDialog.open()}>
          Delete
        </button>
      </div>
    {/if}
  </div>
{/if}

<ConfirmDialog
  bind:this={confirmDialog}
  onConfirmCallback={deleteWordHandler}
/>
