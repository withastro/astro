function printAsRedirects(hostRoutes) {
	const definitions = hostRoutes.definitions;
	const minInputLength = hostRoutes.minInputLength;
	const minTargetLength = hostRoutes.minTargetLength;
	let _redirects = '';
	for (let i = 0; i < definitions.length; i++) {
		const definition = definitions[i];
		if (!definition.target) {
			continue;
		}
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
export { printAsRedirects };
