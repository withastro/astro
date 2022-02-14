import type { Params } from '../../@types/astro';

/**
 * given an array of params like `['x', 'y', 'z']` for
 * src/routes/[x]/[y]/[z]/svelte, create a function
 * that turns a RegExpExecArray into ({ x, y, z })
 */
export function getParams(array: string[]) {
	const fn = (match: RegExpExecArray) => {
		const params: Params = {};
		array.forEach((key, i) => {
			if (key.startsWith('...')) {
				params[key.slice(3)] = match[i + 1] ? decodeURIComponent(match[i + 1]) : undefined;
			} else {
				params[key] = decodeURIComponent(match[i + 1]);
			}
		});
		return params;
	};

	return fn;
}
