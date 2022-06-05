import { createSignal } from 'solid-js';
import { getContext } from '@astrojs/store';
import { useStore } from '@astrojs/solid-js/store';

/** a counter written with Solid */
export default function SolidCounter({ children, id }) {
	// TODO: Astro can't resolve the renderer without this?
	const test = createSignal(0);

	const counter = getContext('counter');
	const state = useStore(counter);

	return (
		<>
			<div id={id} class="counter">
				<button class="decrement" onClick={counter.decrement}>-</button>
				<pre>{state().count}</pre>
				<button class="increment" onClick={counter.increment}>+</button>
			</div>
			<div class="counter-message">{children}</div>
		</>
	);
}
