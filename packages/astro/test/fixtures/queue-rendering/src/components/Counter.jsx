import { useState } from 'react';

export default function Counter({ initialCount = 0 }) {
	const [count, setCount] = useState(initialCount);

	return (
		<div className="counter">
			<p>Count: {count}</p>
			<button onClick={() => setCount(count + 1)}>Increment</button>
		</div>
	);
}
