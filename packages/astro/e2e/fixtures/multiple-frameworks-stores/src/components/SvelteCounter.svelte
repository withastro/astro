
<script>
	import { useStore } from '@astrojs/svelte/store';
	import { getContext } from '@astrojs/store';

	export let id;
  
	const counter = getContext('counter');
	const state = useStore(counter);
</script>

<div {id} class="counter">
  <button class="decrement" on:click={counter.decrement}>-</button>
  <pre>{ $state.count }</pre>
  <button class="increment" on:click={counter.increment}>+</button>
</div>
<div class="counter-message">
  <slot />
</div>

<style>
	.counter {
		background: white;
	}
</style>
