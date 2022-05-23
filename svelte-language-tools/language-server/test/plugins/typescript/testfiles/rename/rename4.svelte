<script>
    import Child from './rename3.svelte';

    let componentRef;
</script>

<main>
    <Child bind:this={componentRef} />
    <Child />
</main>