<script lang="ts">
    import Comp from './diagnostics-if-control-flow-imported.svelte';
    import { writable } from 'svelte/store';

    let a: string | boolean = true as any;
    let b: { a: string | boolean } | undefined = undefined as any;
    let assignA: string = '';
    assignA;
    const aPromise: Promise<boolean> = Promise.resolve(true);
    const store = writable<boolean | string>(true);
</script>

{#if typeof a === 'string'}
    {a === true}
    {assignA = a}
    {#each [true] as a}
        {a === true}
        {assignA = a}
    {/each}
    {#if b}
        {#await aPromise}
            {b.a}
        {:then b}
            {b.a}
        {/await}
        {b.a}
    {:else}
        {b === true}
        <Comp let:b>
            {b.a}
            {#if typeof b === 'boolean'}
                {a === b}
            {:else}
                {a === b}
            {/if}
        </Comp>
    {/if}
{:else}
    {#if typeof $store === 'string'}
        {#each [] as a}
            {$store === a}
        {/each}
    {:else}
        {$store === a}
    {/if}
{/if}