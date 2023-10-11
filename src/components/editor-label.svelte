<script lang='ts'>
  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';
  import cancelIcon from '@iconify/icons-material-symbols/cancel';
  import editIcon from '@iconify/icons-material-symbols/edit';
  import saveIcon from '@iconify/icons-material-symbols/save';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { EditorState } from '@/utils/const';
  import { graphDB } from '@/lib/graph-db';

  export let currentEditorState: EditorState;

  let editorStatusText: string;
  let editWord: string = '';
  $: {
    isEditWord = false;
    switch(currentEditorState) {
    case EditorState.NoWordSelected:
      editorStatusText = 'Try to search, create a word or select in graph'; break;
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
      await graphDB.updateNode($selectedNodeId, 'text', editWord);
      selectedNode.set(await graphDB.getNodeFromId($selectedNodeId));
    }
    isEditWord = false;
  };
  const closeHandler = () => {
    selectedNode.set(undefined);
    isEditWord = false;
  };


</script>

<div class="flex gap-2 items-baseline justify-between max-w-md p-2 grow">

  {#if isEditWord}
    <input id="node-text-editor" type="text" class="input input-bordered max-w-xs" bind:value={editWord} />
  {:else}
    <span class='text-lg'>{editorStatusText}</span>
  {/if}

  <div class="flex gap-2">
    {#if currentEditorState !== EditorState.NoWordSelected}

      {#if !isEditWord}
        <div class="tooltip" data-tip="Edit word">
          <button id="edit-word-text-btn" class="btn btn-square" on:click={openEditWordHandler}>
            <Icon icon={editIcon} width={20} />
          </button>
        </div>
        <div class="tooltip" data-tip="Close">
          <button id="deselect-word-btn" class="btn btn-square" on:click={closeHandler}>
            <Icon icon={closeIcon} width={20} />
          </button>
        </div>
      {:else}
        <div class="tooltip" data-tip="Save word">
          <button id="save-word-text-btn" class="btn btn-square" on:click={saveEditWordHandler}>
            <Icon icon={saveIcon} width={20} />
          </button>
        </div>
        <div class="tooltip" data-tip="Cancel">
          <button id="cancel-edit-word-btn" class="btn btn-square" on:click={() => isEditWord = false}>
            <Icon icon={cancelIcon} width={20} />
          </button>
        </div>
      {/if}

    {/if}
  </div>
</div>