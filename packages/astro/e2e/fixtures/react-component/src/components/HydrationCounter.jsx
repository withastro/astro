import React, { useState } from 'react';

export default function HydrationCounter() {
	const [count, setCount] = useState(0);
	return <button onClick={() => setCount((current) => current + 1)}>Count: {count}</button>;
}
