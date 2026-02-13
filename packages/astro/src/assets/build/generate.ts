import fs, { readFileSync } from 'node:fs';
import { basename } from 'node:path/posix';
import colors from 'piccolore';
import type { BuildApp } from '../../core/build/app.js';
import { getOutDirWithinCwd } from '../../core/build/common.js';
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
import { loadRemoteImage, type RemoteCacheEntry, revalidateRemoteImage } from './remote.js';

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
	etag?: string;
	lastModified?: string;
};

export async function prepareAssetsGenerationEnv(
	app: BuildApp,
	totalCount: number,
): Promise<AssetEnv> {
	const settings = app.getSettings();
	const logger = app.logger;
	const manifest = app.getManifest();
	let useCache = true;
	const assetsCacheDir = new URL('assets/', app.manifest.cacheDir);
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
		// Images are collected during prerender, which outputs to .prerender/ subdirectory
		serverRoot = new URL('.prerender/', manifest.buildServerDir);
		clientRoot = manifest.buildClientDir;
	} else {
		serverRoot = getOutDirWithinCwd(manifest.outDir);
		clientRoot = manifest.outDir;
	}

	return {
		logger,
		isSSR: isServerOutput,
		count,
		useCache,
		assetsCacheDir,
		serverRoot,
		clientRoot,
		imageConfig: settings.config.image,
		assetsFolder: manifest.assetsDir,
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
			`  ${colors.green('▶')} ${filepath} ${colors.dim(statsText)} ${colors.dim(timeIncrease)} ${colors.dim(count)}`,
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

/**
 * Cleans up emitted image files that are not referenced in any build output.
 *
 * When an image is imported (e.g., `import img from './photo.png'`), Astro always emits
 * the image file via Rollup's `emitFile()` during the build. However, the image may not
 * actually be used in the rendered output (e.g., if only metadata like `width`/`height`
 * is used, or if the image is manually processed into a data URI).
 *
 * This function scans the output directory for references to emitted images and deletes
 * any that are not found in the generated HTML, JS, or CSS files.
 */
export async function cleanUnusedEmittedImages(clientRoot: URL, logger: Logger): Promise<void> {
	const emittedImageFiles = globalThis.astroAsset.emittedImageFiles;
	if (!emittedImageFiles || emittedImageFiles.size === 0) {
		return;
	}

	// Collect the set of original source paths that are in staticImageList (handled by optimization pipeline)
	const staticImageList = getStaticImageList();
	const staticImageSourcePaths = new Set<string>();
	for (const [_, data] of staticImageList) {
		if (data.originalSrcPath) {
			staticImageSourcePaths.add(data.originalSrcPath);
		}
	}

	// Find emitted images that are NOT in the optimization pipeline
	const candidatesForDeletion = new Map<string, string>();
	for (const [outputFile, fsPath] of emittedImageFiles) {
		if (!staticImageSourcePaths.has(fsPath)) {
			candidatesForDeletion.set(outputFile, fsPath);
		}
	}

	if (candidatesForDeletion.size === 0) {
		return;
	}

	// Scan output files for references to candidate images.
	// If an emitted image URL appears in any rendered output file (HTML, CSS, JS, etc.),
	// it's considered referenced and should be kept.
	const referencedOutputFiles = new Set<string>();

	// Directories that contain server/build-time code, not user-facing output.
	// These may reference image URLs in their code without the images actually being used in rendered output.
	const excludedDirs = new Set(['.prerender']);

	async function scanDirectory(dir: URL): Promise<void> {
		let entries: fs.Dirent[];
		try {
			entries = await fs.promises.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const entryURL = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
			if (entry.isDirectory()) {
				// Skip server-side / build-time directories
				if (excludedDirs.has(entry.name)) {
					continue;
				}
				await scanDirectory(entryURL);
			} else if (entry.isFile()) {
				const ext = entry.name.split('.').pop()?.toLowerCase();
				// Only scan text-based output files
				if (ext && ['html', 'js', 'mjs', 'css', 'json', 'xml', 'txt'].includes(ext)) {
					try {
						const content = await fs.promises.readFile(entryURL, 'utf-8');
						for (const [outputFile] of candidatesForDeletion) {
							if (content.includes(outputFile)) {
								referencedOutputFiles.add(outputFile);
							}
						}
					} catch {
						/* skip files we can't read */
					}
				}
			}
		}
	}

	await scanDirectory(clientRoot);

	// Delete unreferenced images
	for (const [outputFile] of candidatesForDeletion) {
		if (!referencedOutputFiles.has(outputFile)) {
			try {
				const fileURL = new URL(outputFile, clientRoot);
				logger.debug('assets', `Deleting unreferenced emitted image: ${outputFile}`);
				await fs.promises.unlink(fileURL);
			} catch {
				/* No-op if deletion fails */
			}
		}
	}
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
