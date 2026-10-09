import type { HostRoutes } from './host-route.js';

/**
 * Pretty print a list of definitions into the output format. Keeps
 * things readable for humans. Ex:
 * /nope               /                              301
 * /other              /                              301
 * /two                /                              302
 * /team/articles/*    /team/articles/*\/index.html    200
 * /blog/*             /team/articles/*\/index.html    301
 */
export function printAsRedirects(hostRoutes: HostRoutes) {
	const definitions = hostRoutes.definitions;
	const minInputLength = hostRoutes.minInputLength;
	const minTargetLength = hostRoutes.minTargetLength;
	let _redirects = '';

	// Loop over the definitions
	for (let i = 0; i < definitions.length; i++) {
		const definition = definitions[i];
		if (!definition.target) {
			continue;
		}
		// Figure out the number of spaces to add. We want at least 4 spaces
		// after the input. This ensure that all targets line up together.
		const inputSpaces = minInputLength - definition.input.length + 4;
		const targetSpaces = minTargetLength - definition.target.length + 4;
		_redirects +=
			(i === 0 ? '' : '\n') +
			definition.input +
			' '.repeat(inputSpaces) +
			definition.target +
			' '.repeat(Math.abs(targetSpaces)) +
			definition.status +
			(definition.force ? '!' : '');
	}

	return _redirects;
}
