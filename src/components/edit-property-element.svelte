<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Writable } from 'svelte/store';

  import { graphDB } from '@/lib/graph-db';
  import { ALL_LANGUAGES_MAP, ALL_POS_MAP } from '@/lib/store';
  import type { NodeType } from '@/utils/const';

  import ConfirmDialog from '@/components/confirm-dialog.svelte';

  import Icon from '@iconify/svelte';
  import addIcon from '@iconify/icons-material-symbols/add-rounded';
  import backIcon from '@iconify/icons-material-symbols/arrow-left-alt-rounded';
  import deleteIcon from '@iconify/icons-material-symbols/delete-forever';


  const dispatch = createEventDispatcher();
  const back = () => {
    dispatch('editProperty', { editType: '' });
  };

  const toSorted = (map: Map<string, string>) => new Map([...map].sort());
  const valuesDict = {
    'language': ALL_LANGUAGES_MAP,
    'pos': ALL_POS_MAP,
  } as Record<string, Writable<any>>;
  export let selected_property_key: string;

  const current_list = valuesDict[selected_property_key];

  let newPropText = '';
  const addProperty = async () => {
    if (['pos', 'language'].includes(selected_property_key) && newPropText != '') {
      await graphDB.createNewNode(selected_property_key as NodeType, newPropText);
    }
    newPropText = '';
  };
  let openDialog: () => void;
  let deletePropFn: CallableFunction;
  const confirmDeleteSingleProp = (prop_id: string) => {
    deletePropFn = async () => {
      await graphDB.deleteNodeAndConnectedEdges(prop_id);
    };
    openDialog();
  };

  let selectedPropsId: string[] = [];
  const confirmDeleteMultiProps = () => {
    deletePropFn = async () => {
      await Promise.all(selectedPropsId.map(async (prop_id) =>
        graphDB.deleteNodeAndConnectedEdges(prop_id)
      ));
    };
    openDialog();
  };

</script>

<button class="btn" on:click={() => back()}>
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
        <button class="btn" on:click={() => confirmDeleteMultiProps()}>
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
          <button class="btn" on:click={() => confirmDeleteSingleProp(prop_id)}>
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
        <button class="btn" on:click={() => addProperty()}>
          <Icon icon={addIcon} width={20} />
        </button>
      </th>
    </tr>
  </tbody>
</table>

<ConfirmDialog bind:open={openDialog}
  onConfirmCallback={deletePropFn}
/>
