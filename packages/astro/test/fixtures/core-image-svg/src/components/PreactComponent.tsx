/** @jsxImportSource preact */

import plus from '../assets/plus.svg';

/** A counter written with Preact */
export function PreactCounter() {
	console.log({plus})
	return (
		<div class="counter">
			<img src={plus as unknown as string} />
		</div>
	);
}
