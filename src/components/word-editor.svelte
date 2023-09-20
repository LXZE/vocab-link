<script lang='ts'>
  // @ts-ignore
  import Tags from 'svelte-tags-input';

  import { selectedNode } from '@/lib/store';
  import { NodeType } from '@/utils/const';

</script>

<div class="flex flex-col override-default-tags">
  <div class="p-2">
    {#if ($selectedNode == null)}
      <span>Try to search a word or select in graph</span>
    {:else if ($selectedNode.id == '')}
      <span>New word: { $selectedNode.text }</span>
    {:else if ($selectedNode.type !== NodeType.Word)}
      <span>{$selectedNode.type?.toUpperCase()}: { $selectedNode.text }</span>
    {:else}
      <span>Word: { $selectedNode.text }</span>
    {/if}
  </div>


  <div class='flex flex-col gap-2 my-2'>
    <span>Language</span>
    <Tags tags={['a', 'b']} />
  </div>

  <div class='flex flex-col gap-2 my-2'>
    <span>Part of speech</span>
    <Tags tags={[]} />
  </div>

  <div class='flex flex-col gap-2 my-2'>
    <span>Meaning</span>
    <Tags tags={[]} />
  </div>
</div>

<!-- svelte-ignore css-unused-selector -->
<style global lang='postcss'>

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
}

</style>