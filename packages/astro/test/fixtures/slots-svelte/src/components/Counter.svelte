<script>
  let count = 0;
  export let id;

  function add() {
    count += 1;
  }

  function subtract() {
    count -= 1;
  }
</script>

<div class="counter">
  <button on:click={subtract}>-</button>
  <pre>{ count }</pre>
  <button on:click={add}>+</button>
</div>
<div id={id}>
  <slot><h1 id="fallback">Fallback</h1></slot><slot name="named" /><slot name="dash-case" />
</div>

<style>
  .counter{
    display: grid;
    font-size: 2em;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 2em;
    place-items: center;
  }
  .message {
    text-align: center;
  }
</style>
