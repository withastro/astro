<script>
  import { createEventDispatcher } from 'svelte';

  export let prop;
  const dispatch = createEventDispatcher();
</script>

<button on:click={() => dispatch('foo')}>click</button>
<slot aSlot={prop} />
