// @ts-check

/**
 * @param {string} path
 * @param {{ params?: Record<string, string | undefined>; searchParams?: Record<string, string> | URLSearchParams; hash?: string; }} opts
 */
export const link = (path, opts = {}) => {
	let newPath = path;
	if (opts.params) {
		for (const [key, value] of Object.entries(opts.params)) {
			newPath = newPath.replace(`[${key}]`, value ?? '');
		}
	}
	if (opts.searchParams) {
		const searchParams =
			opts.searchParams instanceof URLSearchParams
				? opts.searchParams
				: new URLSearchParams(opts.searchParams);
		newPath += `?${searchParams.toString()}`;
	}
	if (opts.hash) {
		newPath += `#${opts.hash}`;
	}
	return newPath;
};
