import { useState } from 'preact/hooks';

export default function Counter({ id }) {
	const [count, setCount] = useState(0);
	return (
		<button id={id} onClick={() => setCount(count + 1)}>
			preact {count}
		</button>
	);
}
