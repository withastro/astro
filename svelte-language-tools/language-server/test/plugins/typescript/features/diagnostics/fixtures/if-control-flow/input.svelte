<script lang="ts">
    import Comp from './diagnostics-if-control-flow-imported.svelte';
    import { writable } from 'svelte/store';

    let a: string | boolean = true as any;
    let b: { a: string | boolean } | undefined = undefined as any;
    let assignA: string = '';
    assignA;
    const aPromise: Promise<boolean> = Promise.resolve(true);
    const aNestedPromise: {p: Promise<boolean>} | null = null as any;
    const store = writable<boolean | string>(true);
</script>

{#if typeof a === 'string'}
    {a === true}
    {assignA = a}
    {#each [] as foo}
        {a === true}
        {assignA = a}
        {foo}
    {:else}
        {a === true}
        {assignA = a}
    {/each}
    {#if b}
        {#await aPromise}
            {b.a}
        {:then x}
            {b.a === x}
        {/await}
        {b.a}
    {:else}
        {b === true}
        <Comp let:foo>
            {b.a === foo}
            {#if typeof foo === 'boolean'}
                {foo === a}
            {:else}
                {foo === a}
            {/if}
        </Comp>
    {/if}
{:else}
    {#if typeof $store === 'string'}
        {#each [] as foo}
            {$store === a}
            {foo}
        {/each}
    {:else}
        {$store === a}
    {/if}
{/if}

{a === true}
{assignA = a}

{#await aNestedPromise.p then x}
    {x}
{/await}
{#if aNestedPromise}
    {#await aNestedPromise.p then x}
        {x}
    {/await}
{/if}
