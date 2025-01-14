<script lang="ts">
  import type { Writable } from 'svelte/store';

  import { graphDB } from '@/lib/graph-db';
  import { ALL_LANGUAGES_MAP, ALL_POS_MAP } from '@/lib/store';
  import type { NodeType } from '@/utils/const';

  import ConfirmDialog from '@/components/confirm-dialog.svelte';

  import Icon from '@iconify/svelte';
  import addIcon from '@iconify/icons-material-symbols/add-rounded';
  import backIcon from '@iconify/icons-material-symbols/arrow-left-alt-rounded';
  import deleteIcon from '@iconify/icons-material-symbols/delete-forever';

  interface Props {
    selected_property_key: string;
  }
  let { selected_property_key = $bindable('') }: Props = $props();
  const back = () => {
    selected_property_key = '';
  };

  const toSorted = (map: Map<string, string>) => new Map([...map].sort());
  const valuesDict = {
    'language': ALL_LANGUAGES_MAP,
    'pos': ALL_POS_MAP,
  } as Record<string, Writable<any>>;
  interface Props {
    selected_property_key: string;
  }

  const current_list = valuesDict[selected_property_key];

  let newPropText = $state('');
  const addProperty = async () => {
    if (['pos', 'language'].includes(selected_property_key) && newPropText != '') {
      await graphDB.createNewNode(selected_property_key as NodeType, newPropText);
    }
    newPropText = '';
  };
  let confirmDialog: ConfirmDialog;
  let deletePropFn: CallableFunction = $state(() => {});
  const confirmDeleteSingleProp = (prop_id: string) => {
    deletePropFn = async () => {
      await graphDB.deleteNodeAndConnectedEdges(prop_id);
    };
    confirmDialog.open();
  };

  let selectedPropsId: string[] = $state([]);
  const confirmDeleteMultiProps = () => {
    deletePropFn = async () => {
      await Promise.all(selectedPropsId.map(async (prop_id) =>
        graphDB.deleteNodeAndConnectedEdges(prop_id)
      ));
    };
    confirmDialog.open();
  };

</script>

<button class="btn" onclick={() => back()}>
  <Icon icon={backIcon} width={20} />
  back
</button>

<table class="table my-4">
  <thead>
    <tr>
      <th></th>
      <th class="text-lg text-center">
        {selected_property_key.toUpperCase()}
      </th>
      <th class='text-end'>
        <button class="btn" onclick={() => confirmDeleteMultiProps()}>
          Bulk delete
        </button>
      </th>
    </tr>
  </thead>
  <tbody>
    {#each toSorted($current_list) as [prop_key, prop_id]}
      <tr>
        <th>
          <input type="checkbox" class="checkbox"
            bind:group={selectedPropsId}
            value={prop_id}
          />
        </th>
        <th>
          <span class="text-lg">
            {prop_key}
          </span>
        </th>
        <th class='text-end'>
          <button class="btn" onclick={() => confirmDeleteSingleProp(prop_id)}>
            <Icon icon={deleteIcon} width={20} />
          </button>
        </th>
      </tr>
    {/each}
    <tr>
      <th></th>
      <th>
        <input class="input" placeholder={`Add new ${selected_property_key}`} type="text" bind:value={newPropText}>
      </th>
      <th class='text-end'>
        <button class="btn" onclick={() => addProperty()}>
          <Icon icon={addIcon} width={20} />
        </button>
      </th>
    </tr>
  </tbody>
</table>

<ConfirmDialog bind:this={confirmDialog}
  onConfirmCallback={deletePropFn}
/>
