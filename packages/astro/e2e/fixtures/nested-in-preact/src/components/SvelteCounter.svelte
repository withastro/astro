
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
  <pre id={`${id}-count`}>{ count }</pre>
  <button id={`${id}-increment`} class="increment" on:click={add}>+</button>
	<div class="children">
		<slot />
	</div>
</div>

<style>
	.counter {
		background: white;
	}
</style>
