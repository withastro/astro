import React, { useState } from 'react';

export default function Counter() {
	const [count, setCount] = useState(0);
	return (
		<div id="counter">
			<button className="increment" onClick={() => setCount((value) => value + 1)}>
				+
			</button>
			<pre>{count}</pre>
		</div>
	);
}
