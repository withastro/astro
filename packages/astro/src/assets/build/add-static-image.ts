import { extname } from 'node:path';
import type { AstroSettings } from '../../types/astro.js';
import { recordStaticImage } from '../../core/render-scope/record.js';
import { joinPaths, prependForwardSlash, removeBase } from '../../core/path.js';
import type { ImageTransform } from '../types.js';
import { getAssetsPrefix } from '../utils/getAssetsPrefix.js';
import { isESMImportedImage } from '../utils/index.js';
import { hashTransform, propsToFilename } from '../utils/hash.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../utils/url.js';

export const addStaticImageFactory = (
	settings: AstroSettings,
): typeof globalThis.astroAsset.addStaticImage => {
	return (options, hashProperties, originalFSPath) => {
		if (!globalThis.astroAsset.staticImages) {
			globalThis.astroAsset.staticImages = new Map<
				string,
				{
					originalSrcPath: string;
					transforms: Map<string, { finalPath: string; transform: ImageTransform }>;
				}
			>();
		}

		// Rolldown copies imported images to the output directory, so this source includes the asset prefix and base.
		const ESMImportedImageSrc = isESMImportedImage(options.src) ? options.src.src : options.src;
		const fileExtension = extname(ESMImportedImageSrc);
		const assetPrefix = getAssetsPrefix(fileExtension, settings.config.build.assetsPrefix);
		// Image generation indexes the original output path without the base or asset prefix.
		const finalOriginalPath = removeBase(
			removeBase(ESMImportedImageSrc, settings.config.base),
			assetPrefix,
		);
		const hash = hashTransform(options, settings.config.image.service.entrypoint, hashProperties);

		let finalFilePath: string;
		let transformsForPath = globalThis.astroAsset.staticImages.get(finalOriginalPath);
		const transformForHash = transformsForPath?.transforms.get(hash);
		if (transformsForPath && transformForHash) {
			finalFilePath = transformForHash.finalPath;
		} else {
			finalFilePath = prependForwardSlash(
				joinPaths(
					isESMImportedImage(options.src) ? '' : settings.config.build.assets,
					prependForwardSlash(propsToFilename(finalOriginalPath, options, hash)),
				),
			);

			if (!transformsForPath) {
				globalThis.astroAsset.staticImages.set(finalOriginalPath, {
					originalSrcPath: originalFSPath,
					transforms: new Map(),
				});
				transformsForPath = globalThis.astroAsset.staticImages.get(finalOriginalPath)!;
			}

			transformsForPath.transforms.set(hash, {
				finalPath: finalFilePath,
				transform: options,
			});
		}

		// Deduplicated transforms are recorded for every render so incremental metadata remains per-page.
		recordStaticImage({
			originalPath: finalOriginalPath,
			hash,
			finalPath: finalFilePath,
			originalSrcPath: originalFSPath,
			transform: options,
		});

		// Placeholder URLs carry adapter query parameters through the image generation pipeline.
		const url = createPlaceholderURL(
			settings.config.build.assetsPrefix
				? encodeURI(joinPaths(assetPrefix, finalFilePath))
				: encodeURI(prependForwardSlash(joinPaths(settings.config.base, finalFilePath))),
		);
		const assetQueryParams = settings.adapter?.client?.assetQueryParams;
		if (assetQueryParams) {
			assetQueryParams.forEach((value, key) => {
				url.searchParams.set(key, value);
			});
		}

		return stringifyPlaceholderURL(url);
	};
};
