import { useContext } from 'preact/hooks';
import { Context } from './Context';
import './Counter.css';

export default function Counter({ children }) {
	const { count, increment, decrement } = useContext(Context);

	return (
		<>
			<div class="counter">
				<button onClick={decrement}>-</button>
				<pre>{count}</pre>
				<button onClick={increment}>+</button>
			</div>
			<div class="counter-message">{children}</div>
		</>
	);
}
