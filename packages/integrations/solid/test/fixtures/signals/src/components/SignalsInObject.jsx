export default function SignalsInObject(props) {
	return (
		<div class="solid-signal-object">
			<h1>{props.signalsObject.title}</h1>
			<p>{props.signalsObject.counter()}</p>
		</div>
	);
}
