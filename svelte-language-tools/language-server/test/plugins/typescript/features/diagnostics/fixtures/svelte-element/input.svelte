<script lang="ts">
  let tag = 'div';
  let element: HTMLAnchorElement | HTMLButtonElement;
</script>

<!-- valid -->
<svelte:element this={tag} />
<svelte:element this={tag}>{tag}</svelte:element>
<svelte:element this={tag} on:click={() => tag} />
<svelte:element this={tag} bind:this={element} />

<!-- error -->
<svelte:element />
