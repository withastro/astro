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
