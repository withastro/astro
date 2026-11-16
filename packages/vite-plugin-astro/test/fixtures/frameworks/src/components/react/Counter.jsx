import { useState } from 'react';

export default function Counter({ id }) {
	const [count, setCount] = useState(0);
	return (
		<button id={id} onClick={() => setCount(count + 1)}>
			react {count}
		</button>
	);
}
