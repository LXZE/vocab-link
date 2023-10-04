<script lang='ts'>
  import TagsInput from '@/components/tags-input.svelte';

  import Icon from '@iconify/svelte';
  import addIcon from '@iconify/icons-material-symbols/add';
  import equalRounded from '@iconify/icons-material-symbols/equal-rounded';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { EdgeType, NodeType } from '@/utils/const';
  import { graphDB } from '@/lib/graph-db';
  import type { Node, LinkedNode } from '@/lib/graph-db';
  import { allForms, allWordIndex, queryNodeByText, queryTextsByText } from '@/lib/search';

  export let formsSelected: LinkedNode[];

  let connectedForms: { word: LinkedNode | null, forms: string[] }[] = [];
  const triggerReactivity = async () => {
    connectedForms = connectedForms;
    if ($selectedNodeId)
      selectedNode.set(await graphDB.getNodeFromId($selectedNodeId));
  };

  const setConnectedForms = () => {
    if (!$selectedNode) return;
    connectedForms = [];
    connectedForms.push({
      word: $selectedNode as LinkedNode, forms: $selectedNode?.forms ?? [],
    });
    formsSelected.forEach(node => connectedForms.push({ word: node, forms: node.forms ?? [] }));
    connectedForms = connectedForms;
  };
  $: ($selectedNode, formsSelected), setConnectedForms();
  $: linkedWordNodesId = connectedForms.map(form => form.word)
    .filter((node): node is LinkedNode => node != null)
    .map(node => node.id);

  const wordChoiceFn = async (queryText: string): Promise<Node[]> => {
    return queryNodeByText(queryText, allWordIndex, {
      limit: 10,
      excludeNodesId: linkedWordNodesId,
    });
  };
  const formChoiceFn = async (queryText: string, excludeTexts: string[]): Promise<string[]> => {
    return queryTextsByText(queryText, allForms, { excludeTexts });
  };

  const addRowFormHandler = () => {
    if (connectedForms.slice(-1)[0].word == null) return;
    connectedForms.push({ word: null, forms: [] });
    // trigger only form, not selected node, to prevent reset connected forms
    connectedForms = connectedForms;
  };

  const linkWordFormHandler = (wordIndex: number) => async (addedNode: Node) => {
    if (wordIndex == 0 || !$selectedNodeId) return; // prevent link current selected node itself
    let linkedNode = addedNode;
    if (addedNode.id == '') // if node is new then create first
      linkedNode = await graphDB.createNewNode(NodeType.Word, addedNode.text);
    await Promise.all([
      graphDB.createNewEdge(EdgeType.IsForm, $selectedNodeId, linkedNode.id),
      graphDB.createNewEdge(EdgeType.IsForm, linkedNode.id, $selectedNodeId),
    ]);
    connectedForms[wordIndex].word = linkedNode as LinkedNode; // no need to add linked detail as edge id isn't needed
    connectedForms[wordIndex].forms = linkedNode.forms ?? [];
    triggerReactivity();
  };
  const removeWordFormHandler = (wordIndex: number) => async (removedNode: number | Node) => {
    if (typeof removedNode == 'number' || !$selectedNodeId) return;
    const toDeleteLinkedNode = connectedForms[wordIndex].word;
    if (toDeleteLinkedNode == null) return;
    await Promise.all([
      graphDB.deleteEdgeByNodesId($selectedNodeId, toDeleteLinkedNode.id),
      graphDB.deleteEdgeByNodesId(toDeleteLinkedNode.id, $selectedNodeId),
    ]);
    connectedForms[wordIndex] = { word: null, forms: [] };
    triggerReactivity();
  };

  const addFormHandler = (wordIndex: number) => ({ text: form }: Pick<Node, 'text'>) => {
    const currentWord = connectedForms[wordIndex].word;
    if (!currentWord) return;
    connectedForms[wordIndex].forms.push(form);
    graphDB.updateNode(currentWord.id, 'forms', connectedForms[wordIndex].forms);
    triggerReactivity();
  };
  const removeFormHandler = (wordIndex: number) => (removedIndex: number | any) => {
    const currentWord = connectedForms[wordIndex].word;
    if (!currentWord || typeof removedIndex != 'number') return;
    connectedForms[wordIndex].forms.splice(removedIndex, 1);
    graphDB.updateNode(currentWord.id, 'forms', connectedForms[wordIndex].forms);
    triggerReactivity();
  };
</script>

<div class='flex flex-col py-2'>
  <span>Word Form</span>
  <div class="flex flex-col">
    {#each connectedForms as connectedForm, idx}
      {#if idx == 0}
        <div class="word-form-row">
          <TagsInput class='word-form-tags'
            selectedTags={connectedForm.word ? [connectedForm.word] : []}
            maxTags={1} hideMaxTags hideLabel
            disableRemoveTag disableInput
          />
          <span><Icon icon={equalRounded} width={20} /></span>
          <TagsInput class='word-form-name'
            bind:selectedTags={connectedForm.forms}
            inputLabel='form' hideLabel
            allowCreateNode
            choiceFunction={(q) => formChoiceFn(q, connectedForm.forms)}
            addingCallback={addFormHandler(idx)}
            deletingCallback={removeFormHandler(idx)}
          />
        </div>
        <hr class="my-2 border-zinc-700" />
      {:else}
        <div class="word-form-row">
          <TagsInput class='word-form-tags' inputLabel='word'
            selectedTags={connectedForm.word ? [connectedForm.word] : []}
            maxTags={1} hideMaxTags hideLabel
            tagType={NodeType.Word}
            allowTagClick clickTagCallback={(node) => { selectedNode.set(node); }}
            allowCreateNode choiceFunction={wordChoiceFn}
            addingCallback={linkWordFormHandler(idx)}
            deletingCallback={removeWordFormHandler(idx)}
          />

          {#if connectedForm.word}
            <!-- if word selected then show tags input for forms  -->
            <span><Icon icon={equalRounded} width={20} /></span>
            <TagsInput class='word-form-name'
              selectedTags={connectedForm.forms}
              inputLabel='form' hideLabel
              allowCreateNode
              choiceFunction={(q) => formChoiceFn(q, connectedForm.forms)}
              addingCallback={addFormHandler(idx)}
              deletingCallback={removeFormHandler(idx)}
            />
          {/if}

        </div>
        <hr class="my-2 border-zinc-700" />
      {/if}
    {/each}
  </div>

  <div class="tooltip self-start pt-2" data-tip="Add word form">
    <button class="btn btn-md" on:click={addRowFormHandler}>
      <Icon icon={addIcon} width={20} />
      Add more form
    </button>
  </div>
</div>

<style lang='postcss'>
.word-form-row {
  @apply flex flex-wrap items-center gap-x-2;

  :global(.word-form-tags) {
    @apply py-0;
  }
  :global(.word-form-name) {
    @apply py-0 grow;
  }
}
</style>