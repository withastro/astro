import { useEffect, useState } from 'react';
import { onNewCartItem } from '../cart';

export default function({ count: initialCount }) {
	const [count, setCount] = useState(initialCount);
	useEffect(() => {
		return onNewCartItem(() => setCount(count + 1));
	}, [count]);
	
	return (
		<div className="absolute -right-3 -top-1 w-5 h-5 rounded-full flex items-center justify-center bg-primary text-white text-xs">
{count}</div>
	);
}
