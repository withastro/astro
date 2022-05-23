<script lang="ts">
    import { writable } from "svelte/store";

    const prop = { abc: true };

    function fun() { return prop; }
    const variable = prop;
    const store = writable(prop);

    $: fun().;
    $: variable.;
    $: $store.;

    $: a = fun().;
    $: b = variable.;
    $: c = $store.;
</script>
