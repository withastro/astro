<script>
    import Child from './rename3.svelte';

    export let props2;
</script>

<Child bind:props2 />
<Child {props2} />
<Child props2={props2} />
<Child props2={props2?.toString()} />
