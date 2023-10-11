<script lang="ts">
  import * as amplitude from '@amplitude/analytics-browser';
  import Pane from '@/components/pane.svelte';
  amplitude.init(import.meta.env['VITE_ANALYTICS_KEY'], {
    defaultTracking: true,
  });
</script>

<main class='w-full h-full'>
  <Pane />
</main>
