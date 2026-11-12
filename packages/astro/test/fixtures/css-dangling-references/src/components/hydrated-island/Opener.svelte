<script>
  let Modal = $state(null);
  async function open() {
    Modal = (await import('./LazyModal.svelte')).default;
  }
</script>

<button onclick={open}>Open modal</button>
{#if Modal}<Modal />{/if}
