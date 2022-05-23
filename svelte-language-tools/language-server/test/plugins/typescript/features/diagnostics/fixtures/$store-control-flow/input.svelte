<script lang="ts" context="module">
    const moduleStore = writable<undefined | { a: string | boolean }>({a: 'hi'});
</script>

<script lang="ts">
import { writable } from 'svelte/store';

const store = writable<undefined | { a: string | { b: string | boolean }}>({a: 'hi'});
function isBoolean(t: string | boolean): t is boolean {
    return !!t;
}
let test: boolean;

if ($store) {
    if (typeof $store.a === 'string') {
        test = $store.a === 'string' || $store.a === true;
    } else {
        if (isBoolean($store.a.b)) {
            test = $store.a.b;
            test;
        } else {
            test = $store.a.b;
        }
    }
}

if ($moduleStore) {
    if (typeof $moduleStore.a === 'string') {
        test = $moduleStore.a === 'string' || $moduleStore.a === true;
    }
}
</script>

{#if $store}
    {#if typeof $store.a === 'string'}
        {test = $store.a === 'string' || $store.a === true}
    {:else}
        {#if isBoolean($store.a.b)}
            {test = $store.a.b}
        {:else}
            {test = $store.a.b}
        {/if}
    {/if}
{/if}

{#if $moduleStore}
    {#if typeof $moduleStore.a === 'string'}
        {test = $moduleStore.a === 'string' || $moduleStore.a === true}
    {/if}
{/if}
