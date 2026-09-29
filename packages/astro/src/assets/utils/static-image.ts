import { joinPaths, prependForwardSlash, removeBase } from '@astrojs/internal-helpers/path';
import type { StaticImageConfig } from '../../core/render-scope/scope.js';
import type { ImageTransform, SerializedStaticImage } from '../types.js';
import { getAssetsPrefix } from './getAssetsPrefix.js';
import { hashTransform, propsToFilename } from './hash.js';
import { isESMImportedImage } from './imageKind.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from './url.js';

export interface ResolveStaticImageOptions extends StaticImageConfig {
	serviceEntrypoint: string;
	assetQueryParams?: URLSearchParams;
}

// Also runs in workerd, where `node:path` may be unavailable.
function extname(filePath: string): string {
	const base = filePath.slice(filePath.lastIndexOf('/') + 1);
	const dot = base.lastIndexOf('.');
	return dot <= 0 ? '' : base.slice(dot);
}

// Must stay deterministic: each runtime resolves images on its own and the build dedupes by hash.
export function resolveStaticImage(
	transform: ImageTransform,
	hashProperties: string[],
	originalSrcPath: string | undefined,
	options: ResolveStaticImageOptions,
): { url: string; image: SerializedStaticImage } {
	const src = isESMImportedImage(transform.src) ? transform.src.src : transform.src;
	const assetsPrefix = getAssetsPrefix(extname(src), options.assetsPrefix);

	const originalPath = removeBase(removeBase(src, options.base), assetsPrefix);
	const hash = hashTransform(transform, options.serviceEntrypoint, hashProperties);
	const finalPath = prependForwardSlash(
		joinPaths(
			isESMImportedImage(transform.src) ? '' : options.assetsDir,
			prependForwardSlash(propsToFilename(originalPath, transform, hash)),
		),
	);

	const url = createPlaceholderURL(
		options.assetsPrefix
			? encodeURI(joinPaths(assetsPrefix, finalPath))
			: encodeURI(prependForwardSlash(joinPaths(options.base, finalPath))),
	);
	options.assetQueryParams?.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	return {
		url: stringifyPlaceholderURL(url),
		image: { originalPath, hash, finalPath, originalSrcPath, transform },
	};
}
