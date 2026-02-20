import { useState } from 'react';
import { useTheme } from '../react-app';

export default function Counter() {
	const [count, setCount] = useState(0);
	const theme = useTheme();

	return (
		<div data-testid="counter" data-theme={theme}>
			<p>Count: {count}</p>
			<p>Theme: {theme}</p>
			<button onClick={() => setCount((c) => c + 1)}>Increment</button>
		</div>
	);
}
