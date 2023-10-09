<script lang="ts">

  import { graphDB } from '@/lib/graph-db';
  import { promptDownload, promptUpload } from '@/lib/utils';

  const importDB = async () => {
    try {
      const blob = await promptUpload();
      console.log(blob);
      await graphDB.importData(blob);
    } catch (err) {
      console.error(err);
      // do nothing
      // todo: alert on screen
    }
  };
  const exportDB = async () => {
    const blob = await graphDB.exportData();
    promptDownload(blob);
  };
</script>

<div class="w-full">
  <div class='flex flex-col p-2 gap-2'>
    <span class='px-1'>Import & Export</span>
    <div class="flex  py-2 gap-2">
      <button class="btn" on:click={importDB}>
        Import Database
      </button>
      <button class="btn" on:click={exportDB}>
        Export Database
      </button>
    </div>
  </div>
</div>