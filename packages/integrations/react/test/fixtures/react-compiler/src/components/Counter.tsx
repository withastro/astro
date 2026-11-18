import { useState } from 'react';

export default function Counter({ label }: { label: string }) {
	const [count, setCount] = useState(0);
	return <button data-babel={"before-babel" as string} onClick={() => setCount(count + 1)}>{label}: {count}</button>;
}
