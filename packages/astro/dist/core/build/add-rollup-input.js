function fromEntries(entries) {
	const obj = {};
	for (const [k, v] of entries) {
		obj[k] = v;
	}
	return obj;
}
function addRollupInput(inputOptions, newInputs) {
	if (!inputOptions.input) {
		return { ...inputOptions, input: newInputs };
	}
	if (typeof inputOptions.input === 'string') {
		return {
			...inputOptions,
			input: [inputOptions.input, ...newInputs],
		};
	}
	if (Array.isArray(inputOptions.input)) {
		return {
			...inputOptions,
			input: [...inputOptions.input, ...newInputs],
		};
	}
	if (typeof inputOptions.input === 'object') {
		return {
			...inputOptions,
			input: {
				...inputOptions.input,
				...fromEntries(newInputs.map((i) => [i.split('/').slice(-1)[0].split('.')[0], i])),
			},
		};
	}
	throw new Error(`Unknown rollup input type. Supported inputs are string, array and object.`);
}
export { addRollupInput };
