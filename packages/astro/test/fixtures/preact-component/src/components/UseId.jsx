import { h } from 'preact';
import { useId } from 'preact/hooks';

export default function UseId() {
	const id = useId();

	return (
		<div class="use-id-component">
			<label for={id}>Input</label>
			<input id={id} data-id={id} />
		</div>
	);
}
