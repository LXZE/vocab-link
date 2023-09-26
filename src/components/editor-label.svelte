<script lang='ts'>
  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';
  import editIcon from '@iconify/icons-material-symbols/edit';
  import saveIcon from '@iconify/icons-material-symbols/save';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { EditorState } from '@/utils/const';
  import { graphDB } from '@/lib/graph-db';

  export let currentEditorState: EditorState;

  let editorStatusText: string;
  let editWord: string = '';
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

  let isEditWord = false;
  const openEditWordHandler = () => {
    editWord = $selectedNode?.text ?? '';
    isEditWord = true;
  };
  const saveEditWordHandler = async () => {
    if ($selectedNodeId && $selectedNode!.text != editWord) {
      await graphDB.editNodeText($selectedNodeId, editWord);
      selectedNode.set(await graphDB.getNodeFromId($selectedNodeId));
    }
    isEditWord = false;
  };
  const closeHandler = () => {
    selectedNode.set(undefined);
    isEditWord = false;
  };


</script>

<div class="flex gap-2 items-baseline justify-between max-w-md">

  {#if isEditWord}
    <input type="text" class="input input-bordered max-w-xs" bind:value={editWord} />
  {:else}
    <span>{editorStatusText}</span>
  {/if}

  <div class="flex gap-2">
    {#if currentEditorState !== EditorState.NoWordSelected}

      {#if currentEditorState == EditorState.WordSelected}
        {#if !isEditWord}
          <div class="tooltip" data-tip="Edit word">
            <button class="btn btn-square" on:click={openEditWordHandler}>
              <Icon icon={editIcon} />
            </button>
          </div>
        {:else}
          <div class="tooltip" data-tip="Save word">
            <button class="btn btn-square" on:click={saveEditWordHandler}>
              <Icon icon={saveIcon} />
            </button>
          </div>
        {/if}
      {/if}

      <div class="tooltip" data-tip="Close">
        <button class="btn btn-square" on:click={closeHandler}>
          <Icon icon={closeIcon} />
        </button>
      </div>
    {/if}
  </div>
</div>