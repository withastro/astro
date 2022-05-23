<script lang="ts">
    import Comp from './diagnostics-ignore-generated-imported.svelte';
</script>

{#if typeof a === 'string'}
    {a === true}
    {#each [true] as a}
        {a === true}
    {/each}
    {#if b}
        {b}
    {/if}
{/if}

<Comp
  variant="food"
  style={`${
    1
  }`}
  on:click={() => {}}
/>
