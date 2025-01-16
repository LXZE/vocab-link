<script lang="ts">
  import { debounce } from "lodash";

  import { wordDB } from "@/lib/graph-db";
  import type { ChangeEventHandler } from "svelte/elements";

  interface Props {
    selectedNodeId?: string;
  }

  const { selectedNodeId }: Props = $props();

  let wordNote: string = $state("");
  const setWordNote = async (selectedNodeId: string) => {
    wordNote = await wordDB.getWordNoteById(selectedNodeId);
  };

  const updateWordNote = debounce(
    async (nodeId: string, note: string) => {
      await wordDB.updateWordNoteById(nodeId, note);
    },
    200,
    { trailing: true, maxWait: 500 }
  );
  const updateWordNoteHandler: ChangeEventHandler<HTMLTextAreaElement> = (
    ev
  ) => {
    const newValue = ev.currentTarget.value;
    if (selectedNodeId) {
      updateWordNote(selectedNodeId, newValue);
    }
  };

  $effect(() => {
    if (selectedNodeId) {
      setWordNote(selectedNodeId);
    } else {
      wordNote = "";
    }
  });
</script>

<div class="collapse collapse-arrow mb-2">
  <input type="checkbox" checked={wordNote != ""} />
  <div class="collapse-title">Word Note (Click to toggle open & close)</div>
  <div class="collapse-content">
    <div class="flex flex-col gap-2 my-2">
      <textarea
        class="textarea"
        rows={2}
        bind:value={wordNote}
        oninput={updateWordNoteHandler}
      ></textarea>
    </div>
  </div>
</div>
