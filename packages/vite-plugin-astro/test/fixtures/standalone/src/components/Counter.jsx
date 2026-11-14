import { useState } from 'react';

export default function Counter({ initial }) {
	const [count, setCount] = useState(initial);
	return <button onClick={() => setCount(count + 1)}>count: {count}</button>;
}
