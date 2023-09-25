<script lang='ts'>
  import { debounce } from 'lodash';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { graphDB } from '@/lib/graph-db';

  const setWordNote = async () => {
    wordNote = await graphDB.getWordNoteById($selectedNodeId);
  };
  let wordNote: string = '';
  $: wordNote, updateWordNoteHandler();
  $: $selectedNode, setWordNote();

  const updateWordNote = debounce(async (nodeId: string, note: string) => {
    await graphDB.updateWordNoteById(nodeId, note);
  }, 200, { trailing: true, maxWait: 500 });
  const updateWordNoteHandler = () => {
    if ($selectedNodeId) updateWordNote($selectedNodeId, wordNote);
  };

</script>

<div class='flex flex-col gap-2 my-2'>
  <span>Note</span>
  <input type="text" bind:value={wordNote} />
</div>