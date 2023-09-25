<script lang='ts'>
  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';

  import { selectedNode } from '@/lib/store';
  import { EditorState } from '@/utils/const';

  export let currentEditorState: EditorState;

  let editorStatusText: string;
  $: {
    switch(currentEditorState) {
    case EditorState.NoWordSelected:
      editorStatusText = 'Try to search a word or select in graph'; break;
    case EditorState.WordSelected:
      editorStatusText = `Word: ${ $selectedNode!.text }`; break;
    case EditorState.NonWordSelected:
      editorStatusText = `${$selectedNode!.type?.toUpperCase()}: ${ $selectedNode!.text }`; break;
    default: break;
    }
  }

</script>

<div class="flex gap-2 p-2 items-baseline justify-between">
  <span>{editorStatusText}</span>
  {#if currentEditorState !== EditorState.NoWordSelected}
    <button class="btn btn-square" on:click={() => selectedNode.set(undefined)}>
      <Icon icon={closeIcon} />
    </button>
  {/if}
</div>