<script lang='ts'>
  import TagsInput from '@/components/tags-input.svelte';
  import SearchableInput from '@/components/searchable-input.svelte';

  import Icon from '@iconify/svelte';
  import addIcon from '@iconify/icons-material-symbols/add';
  import deleteIcon from '@iconify/icons-material-symbols/delete-forever-outline';

  import { NodeType } from '@/utils/const';
  import type { CustomNodeObject, Node, LinkedNode } from "@/lib/graph-db"
  import { allWordIndex, queryNodeByText } from '@/lib/search';

  // export let setSelectedNodeForm: (_formName: string) => void = (_) => {};

  // first row: selected node
  export let selectedNode: CustomNodeObject;
  $: internalSelectedNode = selectedNode as LinkedNode;
  let selectedNodesForm = '';

  // 1..n-1 rows: linked nodes
  type ConnectedForm = { words: LinkedNode[], form: string }[]
  let connectedForms: ConnectedForm = [{
    words: [selectedNode as LinkedNode], form: 'test',
  }];
  $: linkedNodesId = [
    ...connectedForms.flatMap(form => form.words).map(node => node.id),
    selectedNode.id as string
  ]

  // last row: new node
  let newWordFormNodes: LinkedNode[] = [];
  let newWordFormName = '';

  const wordChoiceFn = async (queryText: string): Promise<Node[]> => {
    return queryNodeByText(queryText, allWordIndex, {
      limit: 10, excludeNodesId: linkedNodesId,
    })
  }
  const addTag = (newNode: Node) => {
    newWordFormNodes = [...newWordFormNodes, newNode as LinkedNode];
  }

  const addFormHandler = () => {
    if (newWordFormNodes.length == 0 || newWordFormName == '') return;
    // todo: add add connection handler
    connectedForms = [...connectedForms, { words: newWordFormNodes as LinkedNode[], form: newWordFormName }]
    newWordFormNodes = [];
    newWordFormName = '';
  }

  const deleteFormHandler = (index: number) => {
    const [deletedForm] = connectedForms.splice(index, 1);
    // todo: add delete connection handler
    connectedForms = connectedForms;
  }

</script>

<div class='flex flex-col gap-2 py-2'>
  <span>Word Form</span>
  <div class="flex flex-col">

    <div class="word-form-row">
      <TagsInput class="word-form-tags" selectedTags={[internalSelectedNode]}
        inputLabel='word' hideLabel
        tagType={NodeType.Roman}
        maxTags={1} hideMaxTags
        disableRemoveTag disableInput
      />
      <span> = </span>
      <SearchableInput class="word-form-name" bind:textInput={selectedNodesForm} />
    </div>

    {#each connectedForms as connectedForm, idx}
      <div class="word-form-row">
        <TagsInput class='word-form-tags'
          selectedTags={connectedForm.words}
          inputLabel="form" hideLabel
          tagType={NodeType.Word}
          maxTags={2} hideMaxTags
          disableRemoveTag disableInput
        />
        <span> = </span>
        <SearchableInput class="word-form-name"
          inputSize={14}
          textInput={connectedForm.form}
          disabled
        />
        <div class="tooltip" data-tip="Delete word form">
          <button class="btn btn-square btn-md" on:click={() => deleteFormHandler(idx)}>
            <Icon icon={deleteIcon} width={20} />
          </button>
        </div>
      </div>
    {/each}

    <div class="word-form-row">
      <TagsInput class="word-form-tags"
        selectedTags={newWordFormNodes}
        inputLabel="form" hideLabel
        tagType={NodeType.Word}
        choiceFunction={wordChoiceFn}
        addingCallback={addTag}
      />
      <span> = </span>
      <SearchableInput class="word-form-name" bind:textInput={newWordFormName} inputSize={14} />
      <div class="tooltip" data-tip="Add word form">
        <button class="btn btn-square btn-md" on:click={() => addFormHandler()}>
          <Icon icon={addIcon} width={20} />
        </button>
      </div>
    </div>
  </div>
</div>

<style lang='postcss'>
.word-form-row {
  @apply flex flex-wrap items-center gap-x-4;

  :global(.word-form-tags) {
    @apply py-0;
  }

  :global(.word-form-name) {
    @apply min-w-fit;
  }
}
</style>