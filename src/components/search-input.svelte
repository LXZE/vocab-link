<script lang='ts'>
  import Icon from '@iconify/svelte';
  import { liveQuery } from 'dexie';
  import { graphDB } from '@/lib/graph-db';

  const observableWords = liveQuery(async () => {
    const nodes = await graphDB.getAllNodes();
    return nodes.filter(node => node.type == 'text').slice(0, 8);
  });
  
</script>

<div id="search-word-container" class="debug flex flex-col gap-4">
  <div class="join items-center">
      <span class="join-item"><Icon icon="material-symbols:search" /></span>
      <input
        id="search-word-input" class="join-item input input-ghost w-full max-w-xs"
        name="search" type="search" placeholder="Search word…" autocomplete="off" spellcheck="false"
      />
      <div class="join-item">
        <kbd class="kbd kbd-sm">⌘</kbd>
        <kbd class="kbd kbd-sm">K</kbd>
      </div>
  </div>
  <ul class="menu bg-base-200 w-56 rounded-box">
    <!-- <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
    <li><a>Item 3</a></li> -->
  </ul>
</div>