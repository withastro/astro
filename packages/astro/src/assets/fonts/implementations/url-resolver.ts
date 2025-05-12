import type { UrlResolver } from '../definitions.js';
import { joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';

export function createDevUrlResolver({ base }: { base: string }): UrlResolver {
	return {
		resolve(hash) {
			return prependForwardSlash(joinPaths(base, hash));
		},
	};
}

export function createBuildUrlResolver({
	base,
	assetsPrefix,
}: { base: string; assetsPrefix: AssetsPrefix }): UrlResolver {
	return {
		resolve(hash) {
			const prefix = assetsPrefix ? getAssetsPrefix(hash, assetsPrefix) : undefined;
			if (prefix) {
				return joinPaths(prefix, base, hash);
			}
			return prependForwardSlash(joinPaths(base, hash));
		},
	};
}
