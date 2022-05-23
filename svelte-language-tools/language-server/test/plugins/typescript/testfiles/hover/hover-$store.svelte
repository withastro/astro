<script lang="ts">
    import { writable } from 'svelte/store';
    const b = writable<{a: boolean | string} | string>('')
    $b
    if (typeof $b === 'string') {
        $b;
    }
    b;
</script>

{$b}
{#if typeof $b === 'string'}
    {$b}
{/if}
{b}