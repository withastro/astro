export default function Display(props) {
	return (
		<div id={props.id} class="display">
			<span class="value">{props.count()}</span>
		</div>
	);
}
