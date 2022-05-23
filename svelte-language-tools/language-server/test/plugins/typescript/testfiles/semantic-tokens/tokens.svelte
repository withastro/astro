<script lang="ts">
    import Imported from './imported.svelte';
    interface TextContent {
        text: string,
    }

    export let textPromise: Promise<TextContent>;

    async function blurHandler() {}
</script>

{#await textPromise then text}
    <Imported on:blur={blurHandler} value={text.text} />
{/await}
{#each ['a'] as a}
    {a}
{/each}
