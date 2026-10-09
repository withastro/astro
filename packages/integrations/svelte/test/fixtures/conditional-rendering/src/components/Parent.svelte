<script lang="ts">
  import Child from './Child.svelte';

  // Start with false so the child is NOT rendered during SSR/prerendering.
  // This tests that CSS for conditionally rendered components is still included
  // even when the condition is false during the server build.
  let showChild = $state(false);

  $effect(() => {
    showChild = true;
  });
</script>

<div class="parent">
  <p>This is the parent svelte component.</p>

  <label>
    Show child component
    <input type="checkbox" bind:checked={showChild} />
  </label>

  {#if showChild}
    <Child />
  {/if}
</div>

<style>
  .parent {
    border: 1px solid black;
    padding: 16px;
  }
</style>
