<script lang="ts">
    import Slots from '../$$slots/input.svelte';
</script>

<Slots let:valid1 let:validPropWrongType1 let:invalidProp1>
    {valid1 === true}
    {validPropWrongType1 === true}
    {invalidProp1}
    <div slot="foo" let:valid2 let:validPropWrongType2 let:invalidProp2>
        {valid2 === true}
        {validPropWrongType2 === true}
        {invalidProp2}
    </div>
</Slots>