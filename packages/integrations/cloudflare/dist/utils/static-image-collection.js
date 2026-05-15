import { joinPaths, prependForwardSlash, removeBase } from '@astrojs/internal-helpers/path';
import { hashTransform, propsToFilename } from 'astro/assets';
import { isESMImportedImage } from 'astro/assets/utils';
function installAddStaticImage(config) {
	if (globalThis.astroAsset?.addStaticImage) return;
	if (!globalThis.astroAsset) {
		globalThis.astroAsset = { referencedImages: /* @__PURE__ */ new Set() };
	}
	globalThis.astroAsset.addStaticImage = (options, hashProperties, _originalFSPath) => {
		if (!globalThis.astroAsset.staticImages) {
			globalThis.astroAsset.staticImages = /* @__PURE__ */ new Map();
		}
		const ESMImportedImageSrc = isESMImportedImage(options.src) ? options.src.src : options.src;
		const finalOriginalPath = removeBase(
			removeBase(ESMImportedImageSrc, config.base),
			config.assetsPrefix ?? '',
		);
		const hash = hashTransform(options, config.imageServiceEntrypoint, hashProperties);
		let finalFilePath;
		let transformsForPath = globalThis.astroAsset.staticImages.get(finalOriginalPath);
		const transformForHash = transformsForPath?.transforms.get(hash);
		if (transformsForPath && transformForHash) {
			finalFilePath = transformForHash.finalPath;
		} else {
			finalFilePath = prependForwardSlash(
				joinPaths(
					isESMImportedImage(options.src) ? '' : config.buildAssets,
					prependForwardSlash(propsToFilename(finalOriginalPath, options, hash)),
				),
			);
			if (!transformsForPath) {
				globalThis.astroAsset.staticImages.set(finalOriginalPath, {
					originalSrcPath: _originalFSPath,
					transforms: /* @__PURE__ */ new Map(),
				});
				transformsForPath = globalThis.astroAsset.staticImages.get(finalOriginalPath);
			}
			transformsForPath.transforms.set(hash, {
				finalPath: finalFilePath,
				transform: options,
			});
		}
		if (config.assetsPrefix) {
			return encodeURI(joinPaths(config.assetsPrefix, finalFilePath));
		}
		return encodeURI(prependForwardSlash(joinPaths(config.base, finalFilePath)));
	};
}
export { installAddStaticImage };
