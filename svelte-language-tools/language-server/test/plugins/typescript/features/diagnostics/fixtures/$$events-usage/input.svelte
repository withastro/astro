<script lang="ts">
    import Events from '../$$events/input.svelte';
</script>

<!-- valid -->
<Events on:click={e => e} on:foo={e => e.detail === 'bar'} />
<!-- invalid -->
<Events on:bar={e => e} on:foo={e => e.detail === true} />