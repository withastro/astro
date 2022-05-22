
<script>
	export let id;
  let children;
  let count = 0;

  function add() {
		count += 1;
	}

  function subtract() {
		count -= 1;
	}
</script>

<div {id} class="counter">
  <button class="decrement" on:click={subtract}>-</button>
  <pre>{ count }</pre>
  <button class="increment" on:click={add}>+</button>
</div>
<div class="counter-message">
  <slot />
</div>

<style>
	.counter {
		background: white;
	}
</style>
