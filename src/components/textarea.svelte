<script lang='ts'>
  export let placeholder: string = '...';
  export let texts: string[] = ['test'];
</script>


<textarea class="textarea textarea-ghost" placeholder={placeholder}>
  <!-- {#each texts as text}
    <span class="badge">
      {text}
    </span>
  {/each} -->
</textarea>