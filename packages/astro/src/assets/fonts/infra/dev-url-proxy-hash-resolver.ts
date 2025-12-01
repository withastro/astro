import type { Hasher, UrlProxyContentResolver, UrlProxyHashResolver } from '../definitions.js';

export function createDevUrlProxyHashResolver({
	hasher,
	contentResolver,
}: {
	hasher: Hasher;
	contentResolver: UrlProxyContentResolver;
}): UrlProxyHashResolver {
	return {
		resolve({ cssVariable, data, originalUrl, type }) {
			return [
				cssVariable.slice(2),
				formatWeight(data.weight),
				data.style,
				data.subset,
				`${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`,
			]
				.filter(Boolean)
				.join('-');
		},
	};
}

function formatWeight(
	weight: Parameters<UrlProxyHashResolver['resolve']>[0]['data']['weight'],
): string | undefined {
	if (Array.isArray(weight)) {
		return weight.join('-');
	}
	if (typeof weight === 'number') {
		return weight.toString();
	}
	return weight?.replace(/\s+/g, '-');
}
