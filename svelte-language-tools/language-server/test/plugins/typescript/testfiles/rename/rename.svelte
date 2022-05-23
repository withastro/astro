<script lang="ts">
    export let exportedProp: any;
    let innerProp;
</script>

{innerProp}
{#if innerProp}
{/if}
{#await innerProp then x}{x}
{/await}
{#each innerProp as prop}
{/each}
<p class:open={innerProp}></p>

{exportedProp}