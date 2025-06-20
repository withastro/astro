import fs, { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename } from 'node:path/posix';
import { dim, green } from 'kleur/colors';
import { getOutDirWithinCwd } from '../../core/build/common.js';
import type { BuildPipeline } from '../../core/build/pipeline.js';
import { getTimeStat } from '../../core/build/util.js';
import { AstroError } from '../../core/errors/errors.js';
import { AstroErrorData } from '../../core/errors/index.js';
import type { Logger } from '../../core/logger/core.js';
import { isRemotePath, removeLeadingForwardSlash } from '../../core/path.js';
import type { MapValue } from '../../type-utils.js';
import type { AstroConfig } from '../../types/public/config.js';
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
	// Track content hashes to prevent duplicate files
	contentHashMap: Map<string, string>;
};

type ImageData = {
	data: Uint8Array;
	expires: number;
	etag?: string;
	lastModified?: string;
};

export async function prepareAssetsGenerationEnv(
	pipeline: BuildPipeline,
	totalCount: number,
): Promise<AssetEnv> {
	const { config, logger, settings } = pipeline;
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

	const isServerOutput = settings.buildOutput === 'server';
	let serverRoot: URL, clientRoot: URL;
	if (isServerOutput) {
		serverRoot = config.build.server;
		clientRoot = config.build.client;
	} else {
		serverRoot = getOutDirWithinCwd(config.outDir);
		clientRoot = config.outDir;
	}

	const contentHashMap = new Map();

	// Pre-populate contentHashMap with existing SVG files from Vite build
	// This enables content-based deduplication across build phases
	try {
		const assetsDir = new URL(config.build.assets + '/', clientRoot);
		const files = await fs.promises.readdir(assetsDir);
		for (const file of files) {
			if (file.endsWith('.svg')) {
				const filePath = new URL(file, assetsDir);
				const content = await fs.promises.readFile(filePath);
				const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 16);
				const relativePath = `/${config.build.assets}/${file}`;
				contentHashMap.set(contentHash, relativePath);
				logger.debug('assets', `Pre-loaded SVG for deduplication: ${relativePath}`);
			}
		}
	} catch (e) {
		// If scanning fails, continue without pre-population
		logger.debug('assets', `Failed to scan existing SVG files: ${e}`);
	}

	return {
		logger,
		isSSR: isServerOutput,
		count,
		useCache,
		assetsCacheDir,
		serverRoot,
		clientRoot,
		imageConfig: config.image,
		assetsFolder: config.build.assets,
		contentHashMap,
	};
}

function getFullImagePath(originalFilePath: string, env: AssetEnv): URL {
	return new URL(removeLeadingForwardSlash(originalFilePath), env.serverRoot);
}

export async function generateImagesForPath(
	originalFilePath: string,
	transformsAndPath: MapValue<AssetsGlobalStaticImagesList>,
	env: AssetEnv,
) {
	let originalImage: ImageData;

	for (const [_, transform] of transformsAndPath.transforms) {
		await generateImage(transform.finalPath, transform.transform);
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

		// For SVG files, check if we already have a file with the same content
		const isSvg = filepath.endsWith('.svg');
		if (isSvg && isLocalImage) {
			// Read the source file to get its content hash
			const sourceFilePath = getFullImagePath(originalFilePath, env);
			try {
				const sourceContent = await fs.promises.readFile(sourceFilePath);
				const contentHash = createHash('sha256').update(sourceContent).digest('hex').slice(0, 16);

				// Check if we already have a file with this content
				const existingFile = env.contentHashMap.get(contentHash);
				if (existingFile && existingFile !== filepath) {
					// Create a hard link to reuse the existing file (saves space and prevents duplicates)
					const existingFileURL = new URL('.' + existingFile, env.clientRoot);
					try {
						await fs.promises.link(existingFileURL, finalFileURL);
						env.logger.info(
							null,
							`  ${green('▶')} ${filepath} (deduplicated from ${existingFile})`,
						);
						return { cached: 'hit' };
					} catch (_e) {
						// If hard linking fails, try copying
						try {
							await fs.promises.copyFile(existingFileURL, finalFileURL);
							env.logger.info(null, `  ${green('▶')} ${filepath} (copied from ${existingFile})`);
							return { cached: 'hit' };
						} catch (e2) {
							// If both fail, continue with normal generation
							env.logger.debug('assets', `Failed to reuse ${existingFile} for ${filepath}: ${e2}`);
						}
					}
				} else {
					// Track this content hash for future deduplication
					env.contentHashMap.set(contentHash, filepath);
				}
			} catch (e) {
				// If reading source fails, continue with normal generation
				env.logger.debug('assets', `Failed to read source for deduplication: ${e}`);
			}
		}

		const cacheFile = basename(filepath);
		const cachedFileURL = new URL(cacheFile, env.assetsCacheDir);

		// For remote images, we also save a JSON file with the expiration date, etag and last-modified date from the server
		const cacheMetaFile = cacheFile + '.json';
		const cachedMetaFileURL = new URL(cacheMetaFile, env.assetsCacheDir);

		// Check if we have a cached entry first
		try {
			if (isLocalImage) {
				await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);

				return {
					cached: 'hit',
				};
			} else {
				const JSONData = JSON.parse(readFileSync(cachedMetaFileURL, 'utf-8')) as RemoteCacheEntry;

				if (!JSONData.expires) {
					try {
						await fs.promises.unlink(cachedFileURL);
					} catch {
						/* Old caches may not have a separate image binary, no-op */
					}
					await fs.promises.unlink(cachedMetaFileURL);

					throw new Error(
						`Malformed cache entry for ${filepath}, cache will be regenerated for this file.`,
					);
				}

				// Upgrade old base64 encoded asset cache to the new format
				if (JSONData.data) {
					const { data, ...meta } = JSONData;

					await Promise.all([
						fs.promises.writeFile(cachedFileURL, Buffer.from(data, 'base64')),
						writeCacheMetaFile(cachedMetaFileURL, meta, env),
					]);
				}

				// If the cache entry is not expired, use it
				if (JSONData.expires > Date.now()) {
					await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);

					return {
						cached: 'hit',
					};
				}

				// Try to revalidate the cache
				if (JSONData.etag || JSONData.lastModified) {
					try {
						const revalidatedData = await revalidateRemoteImage(options.src as string, {
							etag: JSONData.etag,
							lastModified: JSONData.lastModified,
						});

						if (revalidatedData.data.length) {
							// Image cache was stale, update original image to avoid redownload
							originalImage = revalidatedData;
						} else {
							// Freshen cache on disk
							await writeCacheMetaFile(cachedMetaFileURL, revalidatedData, env);

							await fs.promises.copyFile(
								cachedFileURL,
								finalFileURL,
								fs.constants.COPYFILE_FICLONE,
							);
							return { cached: 'revalidated' };
						}
					} catch (e) {
						// Reuse stale cache if revalidation fails
						env.logger.warn(
							null,
							`An error was encountered while revalidating a cached remote asset. Proceeding with stale cache. ${e}`,
						);

						await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);
						return { cached: 'hit' };
					}
				}

				await fs.promises.unlink(cachedFileURL);
				await fs.promises.unlink(cachedMetaFileURL);
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
			lastModified: originalImage.lastModified,
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
			if (AstroError.is(e)) {
				throw e;
			}
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
					await Promise.all([
						fs.promises.writeFile(cachedFileURL, resultData.data),
						writeCacheMetaFile(cachedMetaFileURL, resultData as ImageData, env),
					]);
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

async function writeCacheMetaFile(
	cachedMetaFileURL: URL,
	resultData: Omit<ImageData, 'data'>,
	env: AssetEnv,
) {
	try {
		return await fs.promises.writeFile(
			cachedMetaFileURL,
			JSON.stringify({
				expires: resultData.expires,
				etag: resultData.etag,
				lastModified: resultData.lastModified,
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
