<script lang="ts">
  import MainSettingElem from '@/components/setting-main-element.svelte';
  import EditPropertyElem from '@/components/edit-property-element.svelte';

  let currentElem: typeof MainSettingElem | typeof EditPropertyElem = MainSettingElem;
  let currentType = '';
  const setSettingElem = (type: string) => {
    currentType = type;
    if (type != '') currentElem = EditPropertyElem;
    else currentElem = MainSettingElem;
  };
</script>

<div class="w-full">
  <svelte:component this={currentElem}
    on:editProperty={({ detail }) => setSettingElem(detail.editType)}
    selected_property_key={currentType}
  />
</div>