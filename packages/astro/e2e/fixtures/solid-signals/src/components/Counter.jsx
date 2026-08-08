export default function Counter(props) {
	return (
		<div id={props.id} class="counter">
			<button class="decrement" onClick={() => props.setCount((v) => v - 1)}>
				-
			</button>
			<pre>{props.count()}</pre>
			<button class="increment" onClick={() => props.setCount((v) => v + 1)}>
				+
			</button>
		</div>
	);
}
