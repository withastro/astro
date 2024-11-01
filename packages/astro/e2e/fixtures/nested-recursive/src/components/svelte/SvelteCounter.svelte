
<script>
	let { id } = $props();
  let count = $state();

  function add() {
		count += 1;
	}

  function subtract() {
		count -= 1;
	}
</script>

<div {id} class="counter">
  <button class="decrement" onclick={subtract}>-</button>
  <pre id={`${id}-count`}>{ count }</pre>
  <button id={`${id}-increment`} class="increment" onclick={add}>+</button>
	<div class="children">
		<slot />
	</div>
</div>

<style>
	.counter {
		background: white;
	}
</style>
