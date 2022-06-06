import { createSignal } from 'solid-js';
import { getContext } from '@astrojs/store';
import { useStore } from '@astrojs/solid-js/store';
import { decrement, increment } from '../stores/counter';
import type { Writable } from '@astrojs/store';
import type { CounterState } from '../stores/counter';

/** a counter written with Solid */
export default function SolidCounter({ children, id }) {
	// TODO: Astro can't resolve the renderer without this?
	const test = createSignal(0);

	const counter = getContext<Writable<CounterState>>('counter');
	const state = useStore(counter);

	const onDecrement = () => decrement(counter);
	const onIncrement = () => increment(counter);

	return (
		<>
			<div id={id} class="counter">
				<button class="decrement" onClick={onDecrement}>-</button>
				<pre>{state().count}</pre>
				<button class="increment" onClick={onIncrement}>+</button>
			</div>
			<div class="counter-message">{children}</div>
		</>
	);
}
