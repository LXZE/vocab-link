<script lang='ts'>
  export let onConfirmCallback: CallableFunction = async () => {};
  export const open = () => confirmDeleteDialog.showModal();

  let confirmDeleteDialog: HTMLDialogElement;

  const closeConfirmDialogHandler = () => confirmDeleteDialog.close();
  const deleteWordHandler = async () => {
    await onConfirmCallback();
    closeConfirmDialogHandler();
  };
</script>

<dialog id="confirm-delete-dialog" class="modal" bind:this={confirmDeleteDialog}>
  <div class="modal-box">
    <h3 class="font-bold text-lg">Warning!</h3>
    <p class="py-4 text-md">The selected node and all connections will be deleted, confirm?</p>
    <div class="modal-action">
      <button class="btn" on:click={closeConfirmDialogHandler}>Cancel</button>
      <button class="btn btn-error" on:click={deleteWordHandler}>Confirm</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>