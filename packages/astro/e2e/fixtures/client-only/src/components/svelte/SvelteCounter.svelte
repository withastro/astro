
<script>
	let { id } = $props();
  let count = $state(0);

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
	<div class="children">
		<slot />
	</div>
</div>

<style>
	.counter {
		background: white;
	}
</style>
