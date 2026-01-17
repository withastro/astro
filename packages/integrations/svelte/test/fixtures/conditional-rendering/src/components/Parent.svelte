<script lang="ts">
  import Child from './Child.svelte';

  let showChild = $state(false);
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
