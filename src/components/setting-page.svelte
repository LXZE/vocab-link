<script lang="ts">
  import MainSettingElem from "@/components/setting-main-element.svelte";
  import EditPropertyElem from "@/components/edit-property-element.svelte";

  let selected_property_key = $state("");
</script>

<div class="w-full">
  {#if selected_property_key == ""}
    <MainSettingElem bind:selected_property_key />
  {:else}
    <EditPropertyElem bind:selected_property_key />
  {/if}
</div>
