<script lang='ts'>
  // @ts-ignore
  import Tags from 'svelte-tags-input';
  import { onMount } from 'svelte';

  import { graphDB } from '@/lib/graph-db';
  import type { Node, TargetNode } from '@/lib/graph-db';
  import type { NodeType } from '@/utils/const';

  export let label = '';
  export let tagType: NodeType;
  export let selectedTags: TargetNode[] = [];

  export let addingCallback: CallableFunction = (_arg1: Node) => {};
  export let deletingCallback: CallableFunction = (_arg1: TargetNode) => {};

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
  $: internalSelectedTags = new Proxy<TargetNode[]>(selectedTags, proxyHandler);

  const getAllTags = async () => graphDB.getAllNodesByType(tagType);
  let allTags: Node[] = [];
  onMount(async () => allTags = await getAllTags());
  $: selectedTagsId = new Set(selectedTags.map(node => node.id));
  $: remainChoices = allTags.filter(node => !selectedTagsId.has(node.id));

</script>

<div class='flex flex-col gap-2 my-2'>
  <span>{label}</span>
  <Tags bind:tags={internalSelectedTags}
    placeholder={`Add ${label.toLowerCase()}...`}
    autoComplete={remainChoices} minChars={0}
    autoCompleteKey={'text'} autoCompleteShowKey={'text'}
    onlyAutocomplete onlyUnique
  />
</div>