<script lang="ts">
    import Slots from './diagnostics-slots-imported.svelte';
</script>

<Slots let:defaultSlotProp prop={defaultSlotProp}>
  {defaultSlotProp === 1}
  {defaultSlotProp === false}
  <p slot="named" let:namedSlotProp class:namedSlotProp>
    {namedSlotProp === 1}
    {namedSlotProp === false}
    {defaultSlotProp}
  </p>
  {namedSlotProp}
  <p slot="spread" let:a let:b={c} let:d>
    {a === true}
    {c === ''}
    {a === ''}
    {d}
  </p>
</Slots>
