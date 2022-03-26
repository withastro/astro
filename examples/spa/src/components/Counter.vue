<template>
	<div id="vue" class="counter">
		<p><slot /></p>
		<div>
			<button @click="subtract()">-</button>
			<pre>{{ count }}</pre>
			<button @click="add()">+</button>
		</div>
	</div>
</template>

<style scoped>
	.counter {
		display: flex;
		text-align: center;
		flex-direction: column;
		padding: 0.5rem;
		margin: 0.25rem;
		border: 1px solid red;
		min-width: 12em;
		font-size: 1.25rem;
	}
	p {
		flex: 1;
	}
	.counter > div {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}
</style>

<script>
import { ref } from 'vue';
export default {
	props: {
		initialCount: Number,
	},
	setup({ initialCount = 0 }) {
		const count = ref(initialCount);
		const add = () => (count.value = count.value + 1);
		const subtract = () => (count.value = count.value - 1);
		return {
			count,
			add,
			subtract,
		};
	},
};
</script>
