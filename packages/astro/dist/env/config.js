const envField = {
	string: (options) => ({
		...options,
		type: 'string',
	}),
	number: (options) => ({
		...options,
		type: 'number',
	}),
	boolean: (options) => ({
		...options,
		type: 'boolean',
	}),
	enum: (options) => ({
		...options,
		type: 'enum',
	}),
};
export { envField };
