<script lang='ts'>
  import { debounce } from 'lodash';

  import { selectedNode, selectedNodeId } from '@/lib/store';
  import { wordDB } from '@/lib/graph-db';

  const setWordNote = async () => {
    wordNote = await wordDB.getWordNoteById($selectedNodeId);
  };
  let wordNote: string = '';
  $: wordNote, updateWordNoteHandler();
  $: $selectedNode, setWordNote();

  const updateWordNote = debounce(async (nodeId: string, note: string) => {
    await wordDB.updateWordNoteById(nodeId, note);
  }, 200, { trailing: true, maxWait: 500 });
  const updateWordNoteHandler = () => {
    if ($selectedNodeId) updateWordNote($selectedNodeId, wordNote);
  };

</script>

<div class='flex flex-col gap-2 my-2'>
  <span>Note</span>
  <textarea class="textarea"
    rows={2}
    bind:value={wordNote}
  />
</div>