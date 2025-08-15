import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import type { UrlResolver } from '../definitions.js';

export function createDevUrlResolver({ base }: { base: string }): UrlResolver {
	let origins: Array<string> | null = null;
	return {
		resolve(hash) {
			origins ??= ['/'];
			return prependForwardSlash(joinPaths(base, hash));
		},
		getOrigins() {
			return origins;
		},
	};
}

export function createBuildUrlResolver({
	base,
	assetsPrefix,
}: {
	base: string;
	assetsPrefix: AssetsPrefix;
}): UrlResolver {
	let origins: Array<string> | null = null;
	return {
		resolve(hash) {
			origins ??= [];
			const prefix = assetsPrefix ? getAssetsPrefix(fileExtension(hash), assetsPrefix) : undefined;
			if (prefix) {
				origins = [...new Set([...origins, prefix])];
				return joinPaths(prefix, base, hash);
			}
			origins = [...new Set([...origins, '/'])];
			return prependForwardSlash(joinPaths(base, hash));
		},
		getOrigins() {
			return origins;
		},
	};
}
