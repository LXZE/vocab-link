<script lang="ts">
  import { graphDB } from '@/lib/graph-db';
  import { promptDownload, promptUpload } from '@/lib/utils';

  interface Props {
    selected_property_key: string;
  }
  let { selected_property_key = $bindable('') }: Props = $props();

  const setSettingHandle = (type: 'language' | 'pos') => {
    selected_property_key = type;
  };


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

<!-- Page 1 -->
<div class='flex flex-col p-2 gap-2'>
  <span class='px-1'>Import & Export</span>
  <div class="flex py-2 gap-2">
    <button class="btn" onclick={importDB}>
      Import Database
    </button>
    <button class="btn" onclick={exportDB}>
      Export Database
    </button>
  </div>
</div>

<div class='flex flex-col p-2 gap-2'>
  <span class='px-1'>Edit property</span>
  <div class="flex  py-2 gap-2">
    <button class="btn" onclick={() => setSettingHandle('language')} >
      Language
    </button>
    <button class="btn" onclick={() => setSettingHandle('pos')}>
      Part of speech
    </button>
  </div>
</div>