<script>
  import A from './rename-prop-with-slot-events.svelte';
</script>

<A prop={1} on:click={e => e} let:aSlot>{aSlot}</A>
