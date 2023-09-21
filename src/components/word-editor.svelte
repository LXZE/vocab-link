<script lang='ts'>
  // @ts-ignore
  import Tags from 'svelte-tags-input';
  import { onMount } from 'svelte';
  import { debounce } from 'lodash';

  import Icon from '@iconify/svelte';
  import closeIcon from '@iconify/icons-material-symbols/close';

  import { selectedNode } from '@/lib/store';
  import { NodeType, EditorState } from '@/utils/const';
  import { graphDB, type CustomNodeObject, type Node, type TargetNode } from '@/lib/graph-db';

  const getEditorStatus = (node: CustomNodeObject | null): EditorState => {
    if (node == null) return EditorState.NoWordSelected;
    else if (node.type !== NodeType.Word) return EditorState.NonWordSelected;
    return EditorState.WordSelected;
  };
  $: currentEditorState = getEditorStatus($selectedNode);

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

  const proxyHandler: ProxyHandler<any> = {
    get: function(target: any, prop: any) {
      const val: CallableFunction = target[prop];
      if (typeof val === 'function') {
        switch(prop) {
        case 'push':
          return function (node: TargetNode) {
            console.log('array pushed');
            console.log(node);
            return Array.prototype[prop].apply(target, arguments);
          };
        case 'splice':
          return function (removedIndex: number) {
            console.log(`array index ${removedIndex} spliced`);
            return Array.prototype[prop].apply(target, arguments);
          };
        case 'pop':
          return function () {
            const popResult: TargetNode = Array.prototype[prop].apply(target, arguments);
            console.log(`Array popped: ${popResult}`);
            return popResult;
          };
        default: return val.bind(target);
        }
      }
      return val;
    }
  };

  const getAllLanguageChoices = async () => graphDB.getAllNodesByType(NodeType.Language);
  let allLanguageChoices: Node[] = [];
  let languageSelected: TargetNode[] = [];
  $: languageTextSelected = new Set(languageSelected.map(node => node.id));
  $: languageChoices = allLanguageChoices.filter(node => !languageTextSelected.has(node.id));

  const getAllPOSChoices = async () => graphDB.getAllNodesByType(NodeType.POS);
  let allPOSChoices: Node[] = [];
  let POSSelected: TargetNode[] = [];
  $: POSTextSelected = new Set(POSSelected.map(node => node.id));
  $: POSChoices = allPOSChoices.filter(node => !POSTextSelected.has(node.id));

  onMount(async () => {
    allPOSChoices = await getAllPOSChoices();
    allLanguageChoices = await getAllLanguageChoices();
  });

  let connectedNodes: TargetNode[] = [];
  const setSelectedTags = async (nodeId: string) => {
    connectedNodes = await graphDB.getAllConnectionByNodeId(nodeId);
    languageSelected = new Proxy(
      connectedNodes.filter(node => node.type == NodeType.Language),
      proxyHandler,
    );
    POSSelected = connectedNodes.filter(node => node.type == NodeType.POS);
  };
  const resetSelected = () => {
    connectedNodes = [];
    languageSelected = [];
    POSSelected = [];
  };

  $: if (currentEditorState == EditorState.WordSelected && $selectedNode != null) {
    setSelectedTags($selectedNode.id as string);
  } else {
    resetSelected();
  }

  const setWordNote = async () => {
    wordNote = await graphDB.getWordNoteById($selectedNode?.id as string);
  };
  let wordNote: string = '';
  $: wordNote, updateWordNoteHandler();
  $: $selectedNode, setWordNote();

  const updateWordNote = debounce(async (nodeId: string, note: string) => {
    await graphDB.updateWordNoteById(nodeId, note);
  }, 200, { trailing: true, maxWait: 500 });
  const updateWordNoteHandler = () => {
    if ($selectedNode) {
      updateWordNote($selectedNode.id as string, wordNote);
    }
  };

  const deleteWordHandler = async () => {
    let isConfirm = confirm('All connection and word will be deleted, confirm?');
    if (isConfirm) {
      const toDeleteNodeId = ($selectedNode?.id ?? '') as string;
      selectedNode.set(null);
      graphDB.deleteNodeAndConnectedEdges(toDeleteNodeId);
      graphDB.deleteWordNoteById(toDeleteNodeId);
    }
  };

</script>

<div class="flex flex-col override-default-tags">
  <div class="flex gap-2 p-2 items-baseline justify-between">
    <span>{editorStatusText}</span>
    {#if currentEditorState !== EditorState.NoWordSelected}
      <button class="btn btn-square" on:click={() => $selectedNode = null}>
        <Icon icon={closeIcon} />
      </button>
    {/if}
  </div>

  {#if currentEditorState == EditorState.WordSelected}
    <div class='flex flex-col gap-2 my-2'>
      <span>Language</span>
      <Tags bind:tags={languageSelected}
        placeholder={'Add language...'}
        autoComplete={languageChoices} minChars={0}
        autoCompleteKey={'text'} autoCompleteShowKey={'text'}
        onlyAutocomplete onlyUnique
      />
    </div>

    <div class='flex flex-col gap-2 my-2'>
      <span>Part of speech</span>
      <Tags bind:tags={POSSelected}
        placeholder={'Add part of speech...'}
        autoComplete={POSChoices}
        autoCompleteKey={'text'} autoCompleteShowKey={'text'}
        onlyAutocomplete onlyUnique
      />
    </div>

    <!-- <div class='flex flex-col gap-2 my-2'>
      <span>Means</span>
      <Tags tags={[]} />
    </div> -->

    <div class='flex flex-col gap-2 my-2'>
      <span>Note</span>
      <input type="text" bind:value={wordNote} />
    </div>

    {#if currentEditorState == EditorState.WordSelected}
      <div class="flex">
        <button class="btn btn-error" on:click={deleteWordHandler}>
          Delete
        </button>
      </div>
    {/if}
  {/if}

</div>

<!-- svelte-ignore css-unused-selector -->
<style lang='postcss'>

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
  :global(.svelte-tags-input-matchs-parent li){
    @apply bg-zinc-800;
  }
}

</style>