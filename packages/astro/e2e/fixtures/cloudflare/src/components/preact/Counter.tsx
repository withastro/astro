import { useState, useEffect } from 'preact/hooks';

export default function Counter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		console.log('Preact useEffect called');
	}, []);

	return (
		<div id="preact-counter">
			<p>Preact count: {count}</p>
			<button onClick={() => setCount(count + 1)}>Increment</button>
		</div>
	);
}
