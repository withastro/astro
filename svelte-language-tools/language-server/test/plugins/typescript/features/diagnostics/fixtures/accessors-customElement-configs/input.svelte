<script lang="ts">
    import AccessorsAndOption from './accessors/accessors-and-option.svelte';
    import Accessors from './accessors/accessors.svelte';
    import CustomElement from './customElement/customElement.svelte';

    let c: CustomElement;
    let a: Accessors;
    let ao: AccessorsAndOption;

    $: c.abc = a.abc = ao.abc = '';
</script>

<CustomElement />
<Accessors />
<AccessorsAndOption />