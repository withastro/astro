<script lang="ts">
    export let prop: any;
    const defaultSlotProp = 1;
    const namedSlotProp = true;
    const spread = {a: true, b: ''};
</script>

{prop}
<slot {defaultSlotProp} />
<slot name="named" {namedSlotProp} />
<slot name="spread" {...spread} />
