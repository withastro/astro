import { createSignal } from 'solid-js';

export default function Counter(props) {
	const [count, setCount] = createSignal(0);
	return (
		<button id={props.id} onClick={() => setCount(count() + 1)}>
			solid {count()}
		</button>
	);
}
