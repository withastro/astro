import { useState } from 'react';

export default function Counter() {
	const [count, setCount] = useState(0);
	return (
		<div>
			<button id="dec" onClick={() => setCount((c) => c - 1)}>
				-
			</button>
			<span id="count">{count}</span>
			<button id="inc" onClick={() => setCount((c) => c + 1)}>
				+
			</button>
		</div>
	);
}
