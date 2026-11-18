import { useState } from 'react';

export default function SubpathCounter() {
	const [count, setCount] = useState(0);

	return (
		<div id="subpath-counter">
			<p>Subpath count: {count}</p>
			<button type="button" onClick={() => setCount((value) => value + 1)}>
				Increment
			</button>
		</div>
	);
}
