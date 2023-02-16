<script>
  let isNavOpen = false;
  const toggleNav = () => (isNavOpen = !isNavOpen);
</script>

<button id="toggle" on:click={toggleNav}>
  {#if isNavOpen}
      <slot name="open" />
  {:else}
      <slot name="close" />
  {/if}
</button>
