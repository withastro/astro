<script lang="typescript">
    let a: string | boolean = null as any;
    let promise = Promise.resolve(true);
</script>

{#if a}
    {#await promise}
        {#if typeof a === 'string'}
            {promise}
        {/if}
    {/await}
{/if}
