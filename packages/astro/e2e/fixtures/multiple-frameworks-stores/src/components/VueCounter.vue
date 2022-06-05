<template>
	<div :id="id" class="counter">
		<button class="decrement" @click="decrement">-</button>
		<pre>{{ state.count }}</pre>
		<button class="increment" @click="increment">+</button>
	</div>
	<div class="counter-message">
		<slot />
	</div>
</template>

<script>
import { useStore } from '@astrojs/vue/store';
import { getContext } from '@astrojs/store';
export default {
	props: {
		id: {
			type: String,
			required: true
		}
  },
	setup(props) {
		const counter = getContext('counter');
		const state = useStore(counter);

		return {
			id: props.id,
			state,
			increment: counter.increment,
			decrement: counter.decrement,
		};
	},
};
</script>
