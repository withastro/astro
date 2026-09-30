import {
	fileExtension,
	joinPaths,
	prependForwardSlash,
	removeBase,
} from '@astrojs/internal-helpers/path';
import type { AssetsPrefix } from '../../core/app/types.js';
import type { ImageTransform, SerializedStaticImage } from '../types.js';
import { getAssetsPrefix } from './getAssetsPrefix.js';
import { hashTransform, propsToFilename } from './hash.js';
import { isESMImportedImage } from './imageKind.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from './url.js';

export interface StaticImageConfig {
	base: string;
	assetsPrefix?: AssetsPrefix;
	assetsDir: string;
}

let staticImageConfig: StaticImageConfig | undefined;

// Set only in build-time prerender runtimes, whose images the build generates.
export function setStaticImageConfig(config: StaticImageConfig | undefined): void {
	staticImageConfig = config;
}

export function getStaticImageConfig(): StaticImageConfig | undefined {
	return staticImageConfig;
}

export interface ResolveStaticImageOptions extends StaticImageConfig {
	serviceEntrypoint: string;
	assetQueryParams?: URLSearchParams;
}

// Must stay deterministic: each runtime resolves images on its own and the build dedupes by hash.
export function resolveStaticImage(
	options: ImageTransform,
	hashProperties: string[],
	originalFSPath: string | undefined,
	config: ResolveStaticImageOptions,
): { url: string; image: SerializedStaticImage } {
	// Rolldown will copy the file to the output directory, as such this is the path in the output directory, including the asset prefix / base
	const ESMImportedImageSrc = isESMImportedImage(options.src) ? options.src.src : options.src;
	const assetPrefix = getAssetsPrefix(fileExtension(ESMImportedImageSrc), config.assetsPrefix);

	// This is the path to the original image, from the dist root, without the base or the asset prefix (e.g. /_astro/image.hash.png)
	const finalOriginalPath = removeBase(removeBase(ESMImportedImageSrc, config.base), assetPrefix);

	const hash = hashTransform(options, config.serviceEntrypoint, hashProperties);

	const finalFilePath = prependForwardSlash(
		joinPaths(
			isESMImportedImage(options.src) ? '' : config.assetsDir,
			prependForwardSlash(propsToFilename(finalOriginalPath, options, hash)),
		),
	);

	// The paths here are used for URLs, so we need to make sure they have the proper format for an URL
	// (leading slash, prefixed with the base / assets prefix, encoded, etc)
	// Create URL object to safely manipulate and append assetQueryParams if available (for adapter-level tracking like skew protection)
	const url = createPlaceholderURL(
		config.assetsPrefix
			? encodeURI(joinPaths(assetPrefix, finalFilePath))
			: encodeURI(prependForwardSlash(joinPaths(config.base, finalFilePath))),
	);
	if (config.assetQueryParams) {
		config.assetQueryParams.forEach((value, key) => {
			url.searchParams.set(key, value);
		});
	}

	return {
		url: stringifyPlaceholderURL(url),
		image: {
			originalPath: finalOriginalPath,
			hash,
			finalPath: finalFilePath,
			originalSrcPath: originalFSPath,
			transform: options,
		},
	};
}
