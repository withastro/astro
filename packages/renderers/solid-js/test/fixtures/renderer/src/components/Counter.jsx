import { createSignal } from 'solid-js';

export default function Counter(props) {
	const [count, setCount] = createSignal(props.start);
	return <button onClick={() => setCount(count() + 1)}>count: {count()}</button>;
}
