import fs, { readFileSync } from 'node:fs';
import { basename, join } from 'node:path/posix';
import { prependForwardSlash } from '../../core/path.js';
import { isServerLikeOutput } from '../../prerender/utils.js';
import { getConfiguredImageService, isESMImportedImage } from '../internal.js';
import type { LocalImageService } from '../services/service.js';
import type { ImageMetadata, ImageTransform } from '../types.js';
import { loadRemoteImage, type RemoteCacheEntry } from './remote.js';
import type { BuildPipeline } from '../../core/build/buildPipeline';

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
	pipeline: BuildPipeline,
	options: ImageTransform,
	filepath: string
): Promise<GenerationData | undefined> {
	const config = pipeline.getConfig();
	const logger = pipeline.getLogger();
	let useCache = true;
	const assetsCacheDir = new URL('assets/', config.cacheDir);

	// Ensure that the cache directory exists
	try {
		await fs.promises.mkdir(assetsCacheDir, { recursive: true });
	} catch (err) {
		logger.warn(
			'astro:assets',
			`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${err}`
		);
		useCache = false;
	}

	let serverRoot: URL, clientRoot: URL;
	if (isServerLikeOutput(config)) {
		serverRoot = config.build.server;
		clientRoot = config.build.client;
	} else {
		serverRoot = config.outDir;
		clientRoot = config.outDir;
	}

	const isLocalImage = isESMImportedImage(options.src);

	const finalFileURL = new URL('.' + filepath, clientRoot);
	const finalFolderURL = new URL('./', finalFileURL);

	// For remote images, instead of saving the image directly, we save a JSON file with the image data and expiration date from the server
	const cacheFile = basename(filepath) + (isLocalImage ? '' : '.json');
	const cachedFileURL = new URL(cacheFile, assetsCacheDir);

	await fs.promises.mkdir(finalFolderURL, { recursive: true });

	// Check if we have a cached entry first
	try {
		if (isLocalImage) {
			await fs.promises.copyFile(cachedFileURL, finalFileURL);

			return {
				cached: true,
			};
		} else {
			const JSONData = JSON.parse(readFileSync(cachedFileURL, 'utf-8')) as RemoteCacheEntry;

			// If the cache entry is not expired, use it
			if (JSONData.expires < Date.now()) {
				await fs.promises.writeFile(finalFileURL, Buffer.from(JSONData.data, 'base64'));

				return {
					cached: true,
				};
			}
		}
	} catch (e: any) {
		if (e.code !== 'ENOENT') {
			throw new Error(`An error was encountered while reading the cache file. Error: ${e}`);
		}
		// If the cache file doesn't exist, just move on, and we'll generate it
	}

	// The original filepath or URL from the image transform
	const originalImagePath = isLocalImage
		? (options.src as ImageMetadata).src
		: (options.src as string);

	let imageData;
	let resultData: { data: Buffer | undefined; expires: number | undefined } = {
		data: undefined,
		expires: undefined,
	};

	// If the image is local, we can just read it directly, otherwise we need to download it
	if (isLocalImage) {
		imageData = await fs.promises.readFile(
			new URL(
				'.' + prependForwardSlash(join(config.build.assets, basename(originalImagePath))),
				serverRoot
			)
		);
	} else {
		const remoteImage = await loadRemoteImage(originalImagePath);
		resultData.expires = remoteImage.expires;
		imageData = remoteImage.data;
	}

	const imageService = (await getConfiguredImageService()) as LocalImageService;
	resultData.data = (
		await imageService.transform(imageData, { ...options, src: originalImagePath }, config.image)
	).data;

	try {
		// Write the cache entry
		if (useCache) {
			if (isLocalImage) {
				await fs.promises.writeFile(cachedFileURL, resultData.data);
			} else {
				await fs.promises.writeFile(
					cachedFileURL,
					JSON.stringify({
						data: Buffer.from(resultData.data).toString('base64'),
						expires: resultData.expires,
					})
				);
			}
		}
	} catch (e) {
		logger.warn(
			'astro:assets',
			`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${e}`
		);
	} finally {
		// Write the final file
		await fs.promises.writeFile(finalFileURL, resultData.data);
	}

	return {
		cached: false,
		weight: {
			// Divide by 1024 to get size in kilobytes
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
