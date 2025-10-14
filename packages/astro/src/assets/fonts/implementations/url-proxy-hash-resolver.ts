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
			return [
				cssVariable.slice(2),
				formatWeight(data.weight),
				data.style,
				data.subset,
				baseHashResolver.resolve(input),
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
