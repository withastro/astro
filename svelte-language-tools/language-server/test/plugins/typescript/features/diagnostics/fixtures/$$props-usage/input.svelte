<script lang="ts">
    import Props from '../$$props-valid/input.svelte';
    // @ts-expect-error
    import PropsInvalid3 from './$$props-invalid3.svelte';
</script>

<!-- valid -->
<Props exported1="valid" exported2="valid" />
<PropsInvalid3 exported1={true} />
<!-- invalid -->
<Props exported1={true} exported2="valid" />
<Props exported1="valid" exported2="valid" invalidProp={true} />
<Props />
