import { h } from 'preact';
import { getContext } from '@astrojs/store';
import { useStore } from '@astrojs/preact/store';

/** a counter written in Preact */
export function PreactCounter({ children, id }) {
	const counter = getContext('counter');
	const state = useStore(counter);

	return (
		<>
			<div id={id} class="counter">
				<button class="decrement" onClick={counter.decrement}>-</button>
				<pre>{state.count}</pre>
				<button class="increment" onClick={counter.increment}>+</button>
			</div>
			<div class="counter-message">{children}</div>
		</>
	);
}
