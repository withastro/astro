<script lang="ts">
    import StrictEvents from './strictEvents.svelte';
</script>

<!-- valid -->
<StrictEvents on:foo={e => e} on:click={e => e} />
<!-- invalid -->
<StrictEvents on:bar={e => e} />