import { useEffect, useState } from 'react';

export default function() {
	const [count, setCount] = useState(0);
	useEffect(() => {
		setTimeout(() => {
			if(count < 10) {
				setCount(count + 1);
			}
		}, 2000);
	}, [count]);
	return (
		<div>Count: {count}</div>
	)
}
