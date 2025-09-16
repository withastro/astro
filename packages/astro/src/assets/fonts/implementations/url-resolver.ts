import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import type { UrlResolver } from '../definitions.js';

export function createDevUrlResolver({ base }: { base: string }): UrlResolver {
	let resolved = false;
	return {
		resolve(hash) {
			resolved ||= true;
			return prependForwardSlash(joinPaths(base, hash));
		},
		getCspResources() {
			return resolved ? ["'self'"] : [];
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
	const resources = new Set<string>();
	return {
		resolve(hash) {
			const prefix = assetsPrefix ? getAssetsPrefix(fileExtension(hash), assetsPrefix) : undefined;
			if (prefix) {
				resources.add(prefix);
				return joinPaths(prefix, base, hash);
			}
			resources.add("'self'");
			return prependForwardSlash(joinPaths(base, hash));
		},
		getCspResources() {
			return Array.from(resources);
		},
	};
}
