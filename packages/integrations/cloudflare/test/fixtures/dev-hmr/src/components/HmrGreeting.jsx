import { useState } from 'react';

export default function HmrGreeting() {
	const [count] = useState(0);
	return <p id="hook-count">{count}</p>;
}
