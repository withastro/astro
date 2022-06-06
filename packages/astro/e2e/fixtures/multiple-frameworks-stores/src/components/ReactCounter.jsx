import { React } from 'react';
import { getContext } from '@astrojs/store';
import { useStore } from '@astrojs/react/store';
import { decrement, increment } from '../stores/counter';

/** a counter written in React */
export function Counter({ children, id }) {
	const counter = getContext('counter');
	const state = useStore(counter);

	const onDecrement = () => decrement(counter);
	const onIncrement = () => increment(counter);

	return (
		<>
			<div id={id} className="counter">
				<button className="decrement" onClick={onDecrement}>-</button>
				<pre>{state.count}</pre>
				<button className="increment" onClick={onIncrement}>+</button>
			</div>
			<div className="counter-message">{children}</div>
		</>
	);
}
