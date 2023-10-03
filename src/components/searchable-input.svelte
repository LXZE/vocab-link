<script lang="ts">
  import type { ChangeEventHandler } from "svelte/elements";

  export let disabled = false;
  export let textInput = '';
  export let inputSize = 15;
  let inputElem: HTMLInputElement;
  let isFocused = false;
  let minimumChars = 1;

  export let onInput: ChangeEventHandler<HTMLInputElement> = (_) => {};

  let showSuggestion = false;
  $: showSuggestion = isFocused
    && textInput.length >= minimumChars
    && candidateChoices.length > 0

  let candidateChoices = ['test', 'test2'];
  let selectedChoiceIndex = 0;

  const focusHandler = () => {
    isFocused = true;
  }
  const blurHandler = () => {
    isFocused = false;
  }

  const keydownHandler = (ev: KeyboardEvent) => {
    // console.log(ev.key);
    switch(ev.key) {
    case 'Enter':
      textInput = candidateChoices[selectedChoiceIndex] ?? ''
      showSuggestion = false;
      break;
    case 'Escape': return blurHandler();
    case 'ArrowUp': {
      ev.preventDefault();
      selectedChoiceIndex =
      selectedChoiceIndex == 0
        ? candidateChoices.length - 1
        : selectedChoiceIndex - 1;
      return;
    }
    case 'ArrowDown': {
      ev.preventDefault();
      selectedChoiceIndex =
      selectedChoiceIndex == candidateChoices.length - 1
        ? 0
        : selectedChoiceIndex + 1;
      return;
    }
    default: break;
    }
  };

</script>


<div class={`relative flex min-w-0 ${$$props.class}`}>
  <input type="text" class='flex' bind:this={inputElem}
    disabled={disabled}
    size={inputSize}
    placeholder={disabled ? '' : "form..."}
    bind:value={textInput}
    on:input={onInput}
    on:keydown={keydownHandler}
    on:focus={focusHandler}
    on:blur={blurHandler}
  >

  {#if showSuggestion}
    <ul class='menu w-full max-w-md rounded-box bg-zinc-800 absolute z-10 border border-zinc-600'
      style={`top: calc(${inputElem.clientHeight}px + 0.5rem)`}
    >
        {#each candidateChoices as choice, idx}
          <li><a href={null} class="hover:bg-zinc-600
            {selectedChoiceIndex == idx ? 'bg-zinc-600' : ''}
          "
            on:mousedown={(ev) => {
              // use mousedown instead of click to prevent blur behaviour
              ev.preventDefault();
              textInput = choice;
              blurHandler();
            }}
            on:mouseenter={() => selectedChoiceIndex = idx}
          >
            <!-- {Object.getOwnPropertyDescriptor(choice, autoCompleteObjectKey)?.value} -->
            {choice}
          </a></li>
        {/each}
    </ul>
  {/if}
</div>


<style lang='postcss'>
input {
  @apply bg-zinc-800 p-2 px-4;
  @apply border border-transparent rounded-sm;
  @apply flex-auto;

  &:focus {
    @apply outline-none border border-zinc-600 rounded-sm;
  }
}
</style>