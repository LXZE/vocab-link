<script lang='ts'>
  import TagsInput from '@/components/tags-input.svelte';

  import Icon from '@iconify/svelte';
  import addIcon from '@iconify/icons-material-symbols/add';
  import deleteIcon from '@iconify/icons-material-symbols/delete-forever-outline';

  import { NodeType } from '@/utils/const';
  import type { CustomNodeObject, Node, LinkedNode } from "@/lib/graph-db"
  import { allForms, allWordIndex, queryNodeByText, queryTextsByText } from '@/lib/search';

  // 1st row: self word form
  export let selectedNode: CustomNodeObject;
  $: internalSelectedNode = selectedNode as LinkedNode;
  $: internalSelectedForm = selectedNode.form ?? [];
  let selectedNodesForm = '';

  // 2..-1 rows: related worm form
  type ConnectedForm = { words: LinkedNode | null, form: string[] }[]
  let connectedForms: ConnectedForm = [{
    words: selectedNode as LinkedNode, form: ['test'],
  }];
  $: linkedWordNodesId = [
    ...connectedForms.map(form => form.words)
      .filter((node): node is LinkedNode => node != null)
      .map(node => node.id),
    selectedNode.id as string
  ]

  const wordChoiceFn = async (queryText: string): Promise<Node[]> => {
    return queryNodeByText(queryText, allWordIndex, {
      limit: 10,
      excludeNodesId: linkedWordNodesId,
    })
  }
  const formChoiceFn = async (queryText: string): Promise<string[]> => {
    const res = queryTextsByText(queryText, allForms);
    console.debug(res);
    return [];
  }
  const addTag = (newNode: Node) => {
    // newWordFormNodes = [...newWordFormNodes, newNode as LinkedNode];
  }

  const addFormHandler = () => {
    // if (newWordFormNodes.length == 0 || newWordFormName == '') return;
    // // todo: add add connection handler
    connectedForms = [...connectedForms, { words: null, form: [] }]
    // newWordFormNodes = [];
    // newWordFormName = '';
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
      <TagsInput selectedTags={[internalSelectedNode]}
        inputLabel='word' hideLabel
        maxTags={1} hideMaxTags
        disableRemoveTag disableInput
      />
      <span> = </span>
      <TagsInput selectedTags={internalSelectedForm}
        inputLabel='form' hideLabel
        allowCreateNode
        choiceFunction={formChoiceFn}
        disableRemoveTag disableInput
      />
      
    </div>

    {#each connectedForms as connectedForm, idx}
      <div class="word-form-row">
        <TagsInput class='word-form-tags'
          selectedTags={
            connectedForm.words
              ? [connectedForm.words]
              : []
          }
          inputLabel="form" hideLabel
          tagType={NodeType.Word}
          maxTags={1} hideMaxTags
        />
        <span> = </span>

        <div class="tooltip" data-tip="Delete word form">
          <button class="btn btn-square btn-md" on:click={() => deleteFormHandler(idx)}>
            <Icon icon={deleteIcon} width={20} />
          </button>
        </div>
      </div>
    {/each}

    <div class="tooltip" data-tip="Add word form">
      <button class="btn btn-square btn-md" on:click={() => addFormHandler()}>
        <Icon icon={addIcon} width={20} />
        Add more form
      </button>
    </div>
  </div>
</div>

<style lang='postcss'>
.word-form-row {
  @apply flex flex-wrap items-center gap-x-4;

  :global(.word-form-tags) {
    @apply py-0;
  }
}
</style>