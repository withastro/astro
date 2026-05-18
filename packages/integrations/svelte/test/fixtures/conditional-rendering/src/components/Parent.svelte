<script lang="ts">
  import Child from './Child.svelte';

  // Use a dynamic condition that can't be statically analyzed
  // The child may or may not render at runtime, so its CSS must be included
  let showChild = $state(Math.random() > 0.5);
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
