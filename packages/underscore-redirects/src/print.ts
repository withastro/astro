import type { RedirectDefinition } from './redirects';

export function print(
	definitions: RedirectDefinition[],
	minInputLength: number,
	minTargetLength: number
) {
	let _redirects = '';

	// Loop over the definitions
	definitions.forEach((defn, i) => {
		// Figure out the number of spaces to add. We want at least 4 spaces
		// after the input. This ensure that all targets line up together.
		let inputSpaces = minInputLength - defn.input.length + 4;
		let targetSpaces = minTargetLength - defn.target.length + 4;
		_redirects +=
			(i === 0 ? '' : '\n') +
			defn.input +
			' '.repeat(inputSpaces) +
			defn.target +
			' '.repeat(Math.abs(targetSpaces)) +
			defn.status;
	});

	return _redirects;
}
