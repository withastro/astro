import type { ImageTransform } from '../../assets/types.js';

export interface SerializedAssetTransform {
	hash: string;
	finalPath: string;
	transform: ImageTransform;
}

export interface SerializedAssetEntry {
	originalPath: string;
	originalSrcPath: string | undefined;
	transforms: SerializedAssetTransform[];
}

export interface SerializedAssetsPayload {
	staticImages: SerializedAssetEntry[];
	referencedImages: string[];
}

function ensureAstroAssetStore() {
	if (!globalThis.astroAsset) {
		globalThis.astroAsset = {};
	}
	if (!globalThis.astroAsset.staticImages) {
		globalThis.astroAsset.staticImages = new Map();
	}
	if (!globalThis.astroAsset.referencedImages) {
		globalThis.astroAsset.referencedImages = new Set();
	}
}

export function collectSerializedAssets(): SerializedAssetsPayload {
	if (!globalThis?.astroAsset?.staticImages) {
		return { staticImages: [], referencedImages: [] };
	}

	const staticImages: SerializedAssetEntry[] = [];
	for (const [originalPath, entry] of globalThis.astroAsset.staticImages.entries()) {
		staticImages.push({
			originalPath,
			originalSrcPath: entry.originalSrcPath,
			transforms: Array.from(entry.transforms.entries()).map(([hash, transformEntry]) => ({
				hash,
				finalPath: transformEntry.finalPath,
				transform: transformEntry.transform,
			})),
		});
	}

	const referencedImages = globalThis.astroAsset.referencedImages
		? Array.from(globalThis.astroAsset.referencedImages)
		: [];

	return { staticImages, referencedImages };
}

export function resetSerializedAssets() {
	if (!globalThis.astroAsset) {
		return;
	}
	globalThis.astroAsset.staticImages = new Map();
	globalThis.astroAsset.referencedImages = new Set();
}

export function mergeSerializedAssets(payload: SerializedAssetsPayload) {
	if (!payload.staticImages.length && !payload.referencedImages.length) {
		return;
	}

	ensureAstroAssetStore();

	for (const entry of payload.staticImages) {
		let target = globalThis.astroAsset.staticImages!.get(entry.originalPath);
		if (!target) {
			target = {
				originalSrcPath: entry.originalSrcPath,
				transforms: new Map(),
			};
			globalThis.astroAsset.staticImages!.set(entry.originalPath, target);
		}

		for (const transformEntry of entry.transforms) {
			target.transforms.set(transformEntry.hash, {
				finalPath: transformEntry.finalPath,
				transform: transformEntry.transform,
			});
		}
	}

	for (const ref of payload.referencedImages) {
		globalThis.astroAsset.referencedImages!.add(ref);
	}
}
