<script lang='ts' context='module'>
  export interface TagChoices extends Node {
    showText: string;
  }
</script>

<script lang='ts'>
  // @ts-ignore
  import Tags from 'svelte-tags-input';
  import { onMount } from 'svelte';

  import { graphDB } from '@/lib/graph-db';
  import type { Node, TargetNode } from '@/lib/graph-db';
  import { NodeType } from '@/utils/const';
  import { normalizeWord } from '@/lib/utils';
  import { selectedNode } from '@/lib/store';

  /** if isAllowCreate, generate new node created instead of select the exist node */
  export let isAllowCreate = false;

  /** if isAllowCreate, the choice function must be provided */
  export let choiceFunction: (_queryText: string) => Promise<Node[]> = async (_) => [];

  export let label = '';
  export let tagType: NodeType;
  export let selectedTags: TargetNode[] = [];

  export let addingCallback: (_arg0: Node) => void = (_) => {};
  export let deletingCallback: (_arg1: TargetNode) => void = (_arg1: TargetNode) => {};

  const proxyHandler: ProxyHandler<any> = {
    get: function(target: any, prop: any) {
      const val: CallableFunction = target[prop];
      if (typeof val === 'function') {
        switch(prop) {
        case 'push':
          return function (node: Node) {
            addingCallback(node);
            return Array.prototype[prop].apply(target, arguments);
          };
        case 'splice':
          return function (removedIndex: number) {
            deletingCallback(selectedTags[removedIndex]);
            return Array.prototype[prop].apply(target, arguments);
          };
        case 'pop':
          return function () {
            const result = Array.prototype[prop].apply(target, arguments);
            deletingCallback(result);
            return result;
          };
        default: return val.bind(target);
        }
      }
      return val;
    }
  };
  $: internalSelectedTags = new Proxy<TagChoices[]>(
    selectedTags.map(tag => ({ ...tag, showText: tag.text })),
    proxyHandler
  );

  const getAllTags = async () => graphDB.getAllNodesByType(tagType);
  let allTags: Node[] = [];
  onMount(async () => {
    if (!isAllowCreate) allTags = await getAllTags();
  });
  $: selectedTagsId = new Set(selectedTags.map(node => node.id));
  $: remainChoices = allTags
    .filter(node => !selectedTagsId.has(node.id))
    .map<TagChoices>(node => ({ ...node, showText: node.text }));

  const internalAutoCompleteFn = async (queryText: string): Promise<Node[]> => {
    const normalizedQueryText = normalizeWord(queryText);

    const result = (await choiceFunction(queryText))
      .map<TagChoices>(choice => ({...choice, showText: choice.text}));

    if (normalizedQueryText.length > 0 && !result.some(res => res.text == normalizedQueryText)) {
      result.push({
        id: '', type: '', text: normalizedQueryText, createdAt: Date.now(),
        showText: `Add '${normalizedQueryText}' and connect`
      });
    }
    return result;
  };

  const tagClickHandler = (tag: TagChoices) => {
    if (tagType == NodeType.Word) selectedNode.set(tag);
  };

</script>

<div class='flex flex-col gap-2 my-2'>
  <span>{label}</span>
  <Tags bind:tags={internalSelectedTags}
    placeholder={`Add ${label.toLowerCase()}...`}
    autoComplete={
      isAllowCreate
        ? internalAutoCompleteFn
        : remainChoices
    }
    minChars={0}
    autoCompleteKey='showText' autoCompleteShowKey='showText'
    onlyAutocomplete onlyUnique
    onTagClick={tagClickHandler}
  />
</div>