import { useState } from 'react';

export default function Counter({ label }) {
	const [count, setCount] = useState(0);
	return <button data-babel="before-babel" onClick={() => setCount(count + 1)}>{label}: {count}</button>;
}
