const createGetEnv = (env) => (key) => {
	const v = env[key];
	if (typeof v === 'undefined' || typeof v === 'string') {
		return v;
	}
	if (typeof v === 'boolean' || typeof v === 'number') {
		return v.toString();
	}
	return void 0;
};
export { createGetEnv };
