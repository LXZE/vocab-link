<script lang='ts'>

  import { selectedNode } from '@/lib/store';
  import { NodeType } from '@/utils/const';

</script>

<div class="debug">
  {#if ($selectedNode == null)}
    <h2>Add a word, find a word or select in graph</h2>
  {:else if ($selectedNode.id == '')}
    <h2>New word: { $selectedNode.text }</h2>
  {:else if ($selectedNode.type !== NodeType.Word)}
    <h2>{$selectedNode.type?.toUpperCase()}: { $selectedNode.text }</h2>
  {:else}
    <h2>Word: { $selectedNode.text }</h2>
  {/if}
</div>
