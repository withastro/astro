<script lang="ts" context="module">
    const noStoreModule = "not a store";
</script>

<script lang="ts">
let store = "not a store";
$store;
if($store) {}
$noStoreModule;
</script>

{$store}
{#if $store}
{/if}

{$noStoreModule}