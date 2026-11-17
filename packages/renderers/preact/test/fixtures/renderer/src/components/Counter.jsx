import { useState } from 'preact/hooks';

export default function Counter({ start }) {
	const [count, setCount] = useState(start);
	return <button onClick={() => setCount(count + 1)}>count: {count}</button>;
}
