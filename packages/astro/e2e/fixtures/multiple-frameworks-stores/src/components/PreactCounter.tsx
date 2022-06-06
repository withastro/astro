import { h } from 'preact';
import { getContext } from '@astrojs/store';
import { useStore } from '@astrojs/preact/store';
import { decrement, increment } from '../stores/counter';
import type { Writable } from '@astrojs/store';
import type { CounterState } from '../stores/counter';

/** a counter written in Preact */
export function PreactCounter({ children, id }) {
	const counter = getContext<Writable<CounterState>>('counter');
	const state = useStore(counter);
	
	const onDecrement = () => decrement(counter);
	const onIncrement = () => increment(counter);

	return (
		<>
			<div id={id} class="counter">
				<button class="decrement" onClick={onDecrement}>-</button>
				<pre>{state.count}</pre>
				<button class="increment" onClick={onIncrement}>+</button>
			</div>
			<div class="counter-message">{children}</div>
		</>
	);
}
