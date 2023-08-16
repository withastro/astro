import fs, { readFileSync } from 'node:fs';
import { basename, join } from 'node:path/posix';
import type { StaticBuildOptions } from '../../core/build/types.js';
import { warn } from '../../core/logger/core.js';
import { prependForwardSlash } from '../../core/path.js';
import { isServerLikeOutput } from '../../prerender/utils.js';
import { getConfiguredImageService, isESMImportedImage, isRemoteImage } from '../internal.js';
import type { LocalImageService } from '../services/service.js';
import type { ImageTransform } from '../types.js';
import { loadRemoteImage, type RemoteCacheEntry } from './remote.js';

interface GenerationDataUncached {
	cached: false;
	weight: {
		before: number;
		after: number;
	};
}

interface GenerationDataCached {
	cached: true;
}

type GenerationData = GenerationDataUncached | GenerationDataCached;

export async function generateImage(
	buildOpts: StaticBuildOptions,
	options: ImageTransform,
	filepath: string
): Promise<GenerationData | undefined> {
	let useCache = true;
	const assetsCacheDir = new URL('assets/', buildOpts.settings.config.cacheDir);

	// Ensure that the cache directory exists
	try {
		await fs.promises.mkdir(assetsCacheDir, { recursive: true });
	} catch (err) {
		warn(
			buildOpts.logging,
			'astro:assets',
			`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${err}`
		);
		useCache = false;
	}

	let serverRoot: URL, clientRoot: URL;
	if (isServerLikeOutput(buildOpts.settings.config)) {
		serverRoot = buildOpts.settings.config.build.server;
		clientRoot = buildOpts.settings.config.build.client;
	} else {
		serverRoot = buildOpts.settings.config.outDir;
		clientRoot = buildOpts.settings.config.outDir;
	}

	const finalFileURL = new URL('.' + filepath, clientRoot);
	const finalFolderURL = new URL('./', finalFileURL);
	const cacheFile = basename(filepath) + (isRemoteImage(options.src) ? '.json' : '');
	const cachedFileURL = new URL(cacheFile, assetsCacheDir);

	const isLocalImage = isESMImportedImage(options.src);

	await fs.promises.mkdir(finalFolderURL, { recursive: true });

	// CHeck if we have a cached entry first
	try {
		if (isLocalImage) {
			await fs.promises.copyFile(cachedFileURL, finalFileURL);

			return {
				cached: true,
			};
		} else {
			const JSONData = JSON.parse(readFileSync(cachedFileURL, 'utf-8')) as RemoteCacheEntry;

			console.log(JSONData.expires, Date.now());

			// If the cache entry is not expired, use it
			if (JSONData.expires < Date.now()) {
				await fs.promises.writeFile(finalFileURL, Buffer.from(JSONData.data, 'base64'));

				return {
					cached: true,
				};
			}
		}
	} catch (e) {
		// no-op. We'll generate the image below if copying from cache failed
	}

	// The original filepath or URL from the image transform
	const originalImagePath = isESMImportedImage(options.src) ? options.src.src : options.src;

	let imageData;
	let resultData: { data: Buffer | undefined; expires: number | undefined } = {
		data: undefined,
		expires: undefined,
	};
	if (isLocalImage) {
		imageData = await fs.promises.readFile(
			new URL(
				'.' +
					prependForwardSlash(
						join(buildOpts.settings.config.build.assets, basename(originalImagePath))
					),
				serverRoot
			)
		);
	} else {
		const remoteImage = await loadRemoteImage(originalImagePath);

		if (!remoteImage) {
			throw new Error(`Could not load remote image ${originalImagePath}.`);
		}

		resultData.expires = remoteImage?.expires;
		imageData = remoteImage?.data;
	}

	const imageService = (await getConfiguredImageService()) as LocalImageService;
	resultData.data = (
		await imageService.transform(
			imageData,
			{ ...options, src: originalImagePath },
			buildOpts.settings.config.image
		)
	).data;

	if (useCache) {
		try {
			if (isLocalImage) {
				await fs.promises.writeFile(cachedFileURL, resultData.data);
				await fs.promises.copyFile(cachedFileURL, finalFileURL);
			} else {
				await fs.promises.writeFile(
					cachedFileURL,
					JSON.stringify({
						data: Buffer.from(resultData.data).toString('base64'),
						expires: resultData.expires,
					})
				);
				await fs.promises.writeFile(finalFileURL, resultData.data);
			}
		} catch (e) {
			warn(
				buildOpts.logging,
				'astro:assets',
				`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${e}`
			);
			await fs.promises.writeFile(finalFileURL, resultData.data);
		}
	} else {
		await fs.promises.writeFile(finalFileURL, resultData.data);
	}

	return {
		cached: false,
		weight: {
			before: Math.trunc(imageData.byteLength / 1024),
			after: Math.trunc(Buffer.from(resultData.data).byteLength / 1024),
		},
	};
}

export function getStaticImageList(): Iterable<
	[string, { path: string; options: ImageTransform }]
> {
	if (!globalThis?.astroAsset?.staticImages) {
		return [];
	}

	return globalThis.astroAsset.staticImages?.entries();
}
