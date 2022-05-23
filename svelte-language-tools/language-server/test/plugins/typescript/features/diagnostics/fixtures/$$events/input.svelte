<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    interface $$Events {
        foo: CustomEvent<string>;
        click: MouseEvent;
    }

    const dispatch = createEventDispatcher();
    // valid
    dispatch('foo', 'bar');
    // invalid
    dispatch('foo', true);
    dispatch('click');
</script>

<button on:click>click</button>