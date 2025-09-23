import type { Hasher, UrlProxyContentResolver, UrlProxyHashResolver } from '../definitions.js';

export function createBuildUrlProxyHashResolver({
	hasher,
	contentResolver,
}: {
	hasher: Hasher;
	contentResolver: UrlProxyContentResolver;
}): UrlProxyHashResolver {
	return {
		resolve({ originalUrl, type }) {
			return `${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`;
		},
	};
}

export function createDevUrlProxyHashResolver({
	baseHashResolver,
}: {
	baseHashResolver: UrlProxyHashResolver;
}): UrlProxyHashResolver {
	return {
		resolve(input) {
			const { cssVariable, data } = input;
			return [cssVariable.slice(2), data.weight, data.style, baseHashResolver.resolve(input)]
				.filter(Boolean)
				.join('-');
		},
	};
}
