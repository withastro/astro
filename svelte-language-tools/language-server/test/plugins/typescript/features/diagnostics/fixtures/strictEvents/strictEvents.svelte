<script strictEvents>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    dispatch('foo', 'bar');
</script>

<button on:click>click</button>