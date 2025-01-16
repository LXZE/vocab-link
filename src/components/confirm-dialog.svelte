<script lang="ts">
  interface Props {
    onConfirmCallback?: CallableFunction;
  }
  let { onConfirmCallback = async () => {} }: Props = $props();
  export const open = () => confirmDeleteDialog.showModal();
  let confirmDeleteDialog: HTMLDialogElement;

  const closeConfirmDialogHandler = () => confirmDeleteDialog.close();
  const deleteWordHandler = async () => {
    await onConfirmCallback();
    closeConfirmDialogHandler();
  };
</script>

<dialog
  id="confirm-delete-dialog"
  class="modal"
  bind:this={confirmDeleteDialog}
>
  <div class="modal-box">
    <h3 class="font-bold text-lg">Warning!</h3>
    <p class="py-4 text-md">
      The selected node and all connections will be deleted and <span
        class="underline">cannot be undone</span
      >,
      <span class="text-lg underline text-red-500">confirm?</span>
    </p>
    <div class="modal-action">
      <button class="btn" onclick={closeConfirmDialogHandler}>Cancel</button>
      <button class="btn btn-error" onclick={deleteWordHandler}>Confirm</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
