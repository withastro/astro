
<script>
	import { useStore } from '@astrojs/svelte/store';
	import { getContext } from '@astrojs/store';
	import { decrement, increment } from '../stores/counter';

	export let id;
  
	const counter = getContext('counter');
	const state = useStore(counter);

	const onDecrement = () => decrement(counter);
	const onIncrement = () => increment(counter);
</script>

<div {id} class="counter">
  <button class="decrement" on:click={onDecrement}>-</button>
  <pre>{ $state.count }</pre>
  <button class="increment" on:click={onIncrement}>+</button>
</div>
<div class="counter-message">
  <slot />
</div>

<style>
	.counter {
		background: white;
	}
</style>
