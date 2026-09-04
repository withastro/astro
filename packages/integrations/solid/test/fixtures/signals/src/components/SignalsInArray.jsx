export default function SignalsInArray(props) {
	return (
		<div class="solid-signal-array">
			<h1>
				{props.signalsArray[0]} {props.signalsArray[3]}
			</h1>
			<p>
				{props.signalsArray[1]()}-{props.signalsArray[2]()}-{props.signalsArray[4]()}
			</p>
		</div>
	);
}
