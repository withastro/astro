import React from 'react';
import './Counter.css';

export default function Counter({
	children,
	count: initialCount,
}: {
	children: React.JSX.Element;
	count: number;
}) {
	const [count, setCount] = React.useState(initialCount);
	const add = () => setCount((i) => i + 1);
	const subtract = () => setCount((i) => i - 1);

	return (
		<>
			<div className="counter">
				<button onClick={subtract}>-</button>
				<pre>{count}</pre>
				<button onClick={add}>+</button>
			</div>
			<div className="counter-message">{children}</div>
		</>
	);
}
