import fs, { readFileSync } from 'node:fs';
import { basename } from 'node:path/posix';
import { dim, green } from 'kleur/colors';
import type PQueue from 'p-queue';
import type { AstroConfig } from '../../@types/astro.js';
import { getOutDirWithinCwd } from '../../core/build/common.js';
import type { BuildPipeline } from '../../core/build/pipeline.js';
import { getTimeStat } from '../../core/build/util.js';
import { AstroError } from '../../core/errors/errors.js';
import { AstroErrorData } from '../../core/errors/index.js';
import type { Logger } from '../../core/logger/core.js';
import { isRemotePath, removeLeadingForwardSlash } from '../../core/path.js';
import { isServerLikeOutput } from '../../core/util.js';
import type { MapValue } from '../../type-utils.js';
import { getConfiguredImageService } from '../internal.js';
import type { LocalImageService } from '../services/service.js';
import type { AssetsGlobalStaticImagesList, ImageMetadata, ImageTransform } from '../types.js';
import { isESMImportedImage } from '../utils/imageKind.js';
import { type RemoteCacheEntry, loadRemoteImage, revalidateRemoteImage } from './remote.js';

interface GenerationDataUncached {
	cached: 'miss';
	weight: {
		before: number;
		after: number;
	};
}

interface GenerationDataCached {
	cached: 'revalidated' | 'hit';
}

type GenerationData = GenerationDataUncached | GenerationDataCached;

type AssetEnv = {
	logger: Logger;
	isSSR: boolean;
	count: { total: number; current: number };
	useCache: boolean;
	assetsCacheDir: URL;
	serverRoot: URL;
	clientRoot: URL;
	imageConfig: AstroConfig['image'];
	assetsFolder: AstroConfig['build']['assets'];
};

type ImageData = {
	data: Uint8Array;
	expires: number;
	etag?: string | null;
};

export async function prepareAssetsGenerationEnv(
	pipeline: BuildPipeline,
	totalCount: number,
): Promise<AssetEnv> {
	const { config, logger } = pipeline;
	let useCache = true;
	const assetsCacheDir = new URL('assets/', config.cacheDir);
	const count = { total: totalCount, current: 1 };

	// Ensure that the cache directory exists
	try {
		await fs.promises.mkdir(assetsCacheDir, { recursive: true });
	} catch (err) {
		logger.warn(
			null,
			`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${err}`,
		);
		useCache = false;
	}

	let serverRoot: URL, clientRoot: URL;
	if (isServerLikeOutput(config)) {
		serverRoot = config.build.server;
		clientRoot = config.build.client;
	} else {
		serverRoot = getOutDirWithinCwd(config.outDir);
		clientRoot = config.outDir;
	}

	return {
		logger,
		isSSR: isServerLikeOutput(config),
		count,
		useCache,
		assetsCacheDir,
		serverRoot,
		clientRoot,
		imageConfig: config.image,
		assetsFolder: config.build.assets,
	};
}

function getFullImagePath(originalFilePath: string, env: AssetEnv): URL {
	return new URL(removeLeadingForwardSlash(originalFilePath), env.serverRoot);
}

export async function generateImagesForPath(
	originalFilePath: string,
	transformsAndPath: MapValue<AssetsGlobalStaticImagesList>,
	env: AssetEnv,
	queue: PQueue,
) {
	let originalImage: ImageData;

	for (const [_, transform] of transformsAndPath.transforms) {
		await queue
			.add(async () => generateImage(transform.finalPath, transform.transform))
			.catch((e) => {
				throw e;
			});
	}

	// In SSR, we cannot know if an image is referenced in a server-rendered page, so we can't delete anything
	// For instance, the same image could be referenced in both a server-rendered page and build-time-rendered page
	if (
		!env.isSSR &&
		transformsAndPath.originalSrcPath &&
		!globalThis.astroAsset.referencedImages?.has(transformsAndPath.originalSrcPath)
	) {
		try {
			if (transformsAndPath.originalSrcPath) {
				env.logger.debug(
					'assets',
					`Deleting ${originalFilePath} as it's not referenced outside of image processing.`,
				);
				await fs.promises.unlink(getFullImagePath(originalFilePath, env));
			}
		} catch {
			/* No-op, it's okay if we fail to delete one of the file, we're not too picky. */
		}
	}

	async function generateImage(filepath: string, options: ImageTransform) {
		const timeStart = performance.now();
		const generationData = await generateImageInternal(filepath, options);

		const timeEnd = performance.now();
		const timeChange = getTimeStat(timeStart, timeEnd);
		const timeIncrease = `(+${timeChange})`;
		const statsText =
			generationData.cached !== 'miss'
				? generationData.cached === 'hit'
					? `(reused cache entry)`
					: `(revalidated cache entry)`
				: `(before: ${generationData.weight.before}kB, after: ${generationData.weight.after}kB)`;
		const count = `(${env.count.current}/${env.count.total})`;
		env.logger.info(
			null,
			`  ${green('▶')} ${filepath} ${dim(statsText)} ${dim(timeIncrease)} ${dim(count)}`,
		);
		env.count.current++;
	}

	async function generateImageInternal(
		filepath: string,
		options: ImageTransform,
	): Promise<GenerationData> {
		const isLocalImage = isESMImportedImage(options.src);
		const finalFileURL = new URL('.' + filepath, env.clientRoot);

		const finalFolderURL = new URL('./', finalFileURL);
		await fs.promises.mkdir(finalFolderURL, { recursive: true });

		// For remote images, instead of saving the image directly, we save a JSON file with the image data, expiration date and etag from the server
		const cacheFile = basename(filepath) + (isLocalImage ? '' : '.json');
		const cachedFileURL = new URL(cacheFile, env.assetsCacheDir);

		// Check if we have a cached entry first
		try {
			if (isLocalImage) {
				await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);

				return {
					cached: 'hit',
				};
			} else {
				const JSONData = JSON.parse(readFileSync(cachedFileURL, 'utf-8')) as RemoteCacheEntry;

				if (!JSONData.data || !JSONData.expires) {
					await fs.promises.unlink(cachedFileURL);

					throw new Error(
						`Malformed cache entry for ${filepath}, cache will be regenerated for this file.`,
					);
				}

				// If the cache entry is not expired, use it
				if (JSONData.expires > Date.now()) {
					await fs.promises.writeFile(finalFileURL, Buffer.from(JSONData.data, 'base64'));

					return {
						cached: 'hit',
					};
				}

				// Try to revalidate the cache
				if (JSONData.etag) {
					try {
						const revalidatedData = await revalidateRemoteImage(
							options.src as string,
							JSONData.etag,
						);

						if (revalidatedData.data.length) {
							// Image cache was stale, update original image to avoid redownload
							originalImage = revalidatedData;
						} else {
							revalidatedData.data = Buffer.from(JSONData.data, 'base64');

							// Freshen cache on disk
							await writeRemoteCacheFile(cachedFileURL, revalidatedData, env);

							await fs.promises.writeFile(finalFileURL, revalidatedData.data);
							return { cached: 'revalidated' };
						}
					} catch (e) {
						// Reuse stale cache if revalidation fails
						env.logger.warn(
							null,
							`An error was encountered while revalidating a cached remote asset. Proceeding with stale cache. ${e}`,
						);

						await fs.promises.writeFile(finalFileURL, Buffer.from(JSONData.data, 'base64'));
						return { cached: 'hit' };
					}
				}

				await fs.promises.unlink(cachedFileURL);
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

		if (!originalImage) {
			originalImage = await loadImage(originalFilePath, env);
		}

		let resultData: Partial<ImageData> = {
			data: undefined,
			expires: originalImage.expires,
			etag: originalImage.etag,
		};

		const imageService = (await getConfiguredImageService()) as LocalImageService;

		try {
			resultData.data = (
				await imageService.transform(
					originalImage.data,
					{ ...options, src: originalImagePath },
					env.imageConfig,
				)
			).data;
		} catch (e) {
			const error = new AstroError(
				{
					...AstroErrorData.CouldNotTransformImage,
					message: AstroErrorData.CouldNotTransformImage.message(originalFilePath),
				},
				{ cause: e },
			);

			throw error;
		}

		try {
			// Write the cache entry
			if (env.useCache) {
				if (isLocalImage) {
					await fs.promises.writeFile(cachedFileURL, resultData.data);
				} else {
					await writeRemoteCacheFile(cachedFileURL, resultData as ImageData, env);
				}
			}
		} catch (e) {
			env.logger.warn(
				null,
				`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${e}`,
			);
		} finally {
			// Write the final file
			await fs.promises.writeFile(finalFileURL, resultData.data);
		}

		return {
			cached: 'miss',
			weight: {
				// Divide by 1024 to get size in kilobytes
				before: Math.trunc(originalImage.data.byteLength / 1024),
				after: Math.trunc(Buffer.from(resultData.data).byteLength / 1024),
			},
		};
	}
}

async function writeRemoteCacheFile(cachedFileURL: URL, resultData: ImageData, env: AssetEnv) {
	try {
		return await fs.promises.writeFile(
			cachedFileURL,
			JSON.stringify({
				data: Buffer.from(resultData.data).toString('base64'),
				expires: resultData.expires,
				etag: resultData.etag,
			}),
		);
	} catch (e) {
		env.logger.warn(
			null,
			`An error was encountered while writing the cache file for a remote asset. Proceeding without caching this asset. Error: ${e}`,
		);
	}
}

export function getStaticImageList(): AssetsGlobalStaticImagesList {
	if (!globalThis?.astroAsset?.staticImages) {
		return new Map();
	}

	return globalThis.astroAsset.staticImages;
}

async function loadImage(path: string, env: AssetEnv): Promise<ImageData> {
	if (isRemotePath(path)) {
		return await loadRemoteImage(path);
	}

	return {
		data: await fs.promises.readFile(getFullImagePath(path, env)),
		expires: 0,
	};
}
