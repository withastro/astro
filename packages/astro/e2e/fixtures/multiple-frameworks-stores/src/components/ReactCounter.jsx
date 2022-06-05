import { React } from 'react';
import { getContext } from '@astrojs/store';
import { useStore } from '@astrojs/react/store';

/** a counter written in React */
export function Counter({ children, id }) {
	const counter = getContext('counter');
	const state = useStore(counter);

	return (
		<>
			<div id={id} className="counter">
				<button className="decrement" onClick={counter.decrement}>-</button>
				<pre>{state.count}</pre>
				<button className="increment" onClick={counter.increment}>+</button>
			</div>
			<div className="counter-message">{children}</div>
		</>
	);
}
