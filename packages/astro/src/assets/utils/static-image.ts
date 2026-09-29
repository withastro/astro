import { joinPaths, prependForwardSlash, removeBase } from '@astrojs/internal-helpers/path';
import type { StaticImageConfig } from '../../core/render-scope/scope.js';
import type { ImageTransform, SerializedStaticImage } from '../types.js';
import { getAssetsPrefix } from './getAssetsPrefix.js';
import { hashTransform, propsToFilename } from './hash.js';
import { isESMImportedImage } from './imageKind.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from './url.js';

export interface ResolveStaticImageOptions extends StaticImageConfig {
	/** The image service entrypoint, part of the transform hash. */
	serviceEntrypoint: string;
	/** Query parameters appended to the URL (e.g. for skew protection). */
	assetQueryParams?: URLSearchParams;
}

/** Pure-string replacement for `path.extname` (no node: import). */
function extname(filePath: string): string {
	const base = filePath.slice(filePath.lastIndexOf('/') + 1);
	const dot = base.lastIndexOf('.');
	return dot <= 0 ? '' : base.slice(dot);
}

/**
 * Resolves an image transform to the file it will be emitted to at build time.
 *
 * Pure and deterministic: the same transform always resolves to the same file,
 * so any number of runtimes (threads, workerd isolates) can resolve images
 * independently and the build dedupes the records by `originalPath` + `hash`.
 *
 * Returns the URL to use in the rendered output, and the record the build
 * needs to generate the file.
 */
export function resolveStaticImage(
	transform: ImageTransform,
	hashProperties: string[],
	originalSrcPath: string | undefined,
	options: ResolveStaticImageOptions,
): { url: string; image: SerializedStaticImage } {
	// Rolldown copies the file to the output directory, so this is the path in the output directory, including the base / assets prefix
	const src = isESMImportedImage(transform.src) ? transform.src.src : transform.src;
	const assetsPrefix = getAssetsPrefix(extname(src), options.assetsPrefix);

	// The path to the original image from the dist root, without the base or the assets prefix (e.g. /_astro/image.hash.png)
	const originalPath = removeBase(removeBase(src, options.base), assetsPrefix);
	const hash = hashTransform(transform, options.serviceEntrypoint, hashProperties);
	const finalPath = prependForwardSlash(
		joinPaths(
			isESMImportedImage(transform.src) ? '' : options.assetsDir,
			prependForwardSlash(propsToFilename(originalPath, transform, hash)),
		),
	);

	// The paths here are used for URLs, so we need to make sure they have the proper format for an URL
	// (leading slash, prefixed with the base / assets prefix, encoded, etc)
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
