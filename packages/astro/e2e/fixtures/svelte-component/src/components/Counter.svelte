<script lang="ts">
	let { id, count } = $props<{ id: number, count: number }>();

  function add() {
    count += 1;
  }

  function subtract() {
    count -= 1;
  }
</script>

<div {id} class="counter">
  <button class="decrement" onclick={subtract}>-</button>
  <pre>{ count }</pre>
  <button class="increment" onclick={add}>+</button>
</div>
<div id={`${id}-message`} class="message">
  <slot />
</div>

<style>
  .counter {
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
