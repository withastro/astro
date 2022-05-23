<script type="ts">
  export let x = 0

  let x2: number

  $: x2 = x * x

  $: {
    x2 = x * x
  }

  $: sqrt = x * x
</script>

<p>{x2} == {sqrt}</p>
