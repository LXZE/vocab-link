<script lang="ts">
  import Pane from "@/components/pane.svelte";
</script>

<svelte:head>
  <script
    defer
    src={import.meta.env["VITE_ANALYTICS_ENDPOINT"]}
    data-website-id={import.meta.env["VITE_ANALYTICS_KEY"]}
  ></script>
</svelte:head>

<main class="w-full h-full">
  <Pane />
</main>
