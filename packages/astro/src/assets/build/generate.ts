import fs, { readFileSync } from 'node:fs';
import { basename } from 'node:path/posix';
import { recordTiming } from '@astrojs/internal-helpers/timings';
import colors from 'piccolore';
import os from 'node:os';
import PQueue from 'p-queue';
import { getTimeStat } from '@astrojs/vite-plugin-router/_internal/core/build/util.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/errors.js';
import { copyCachedFile } from '@astrojs/vite-plugin-router/_internal/core/fs/index.js';
import { AstroErrorData } from '@astrojs/runtime/_internal/core/errors/index.js';
import {
	astroToRuntimeLogger,
	type AstroLogger,
} from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';
import { isRemotePath, removeLeadingForwardSlash } from '../../core/path.js';
import type { MapValue } from '../../type-utils.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { PrerenderDoneContext } from '@astrojs/vite-plugin-router';
import type { AstroPrerenderer } from '../../types/public/integrations.js';
import { loadBuildImageService } from '../../core/build/image-service.js';
import type { ImageConfig, LocalImageService } from '../services/service.js';
import { getAssetsPluginApi } from '../utils/assets.js';
import type {
	AssetsGlobalStaticImagesList,
	ImageMetadata,
	ImageTransform,
	SerializedStaticImage,
} from '../types.js';
import { isESMImportedImage } from '../utils/imageKind.js';
import { getImageServiceConfig } from '../utils/service-config.js';
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
	logger: AstroLogger;
	getImageService: () => Promise<LocalImageService>;
	referencedImages: ReadonlySet<string>;
	isSSR: boolean;
	count: { total: number; current: number };
	useCache: boolean;
	assetsCacheDir: URL;
	serverRoot: URL;
	clientRoot: URL;
	imageConfig: ImageConfig;
	assetsFolder: AstroConfig['build']['assets'];
};

type ImageData = {
	data: Uint8Array;
	expires: number;
	etag?: string;
	lastModified?: string;
};

async function prepareAssetsGenerationEnv(
	{ settings, logger }: { settings: AstroSettings; logger: AstroLogger },
	totalCount: number,
	{
		loadImageService,
		referencedImages,
		outputDirectories,
	}: {
		loadImageService: () => Promise<LocalImageService>;
		referencedImages: ReadonlySet<string>;
		outputDirectories: PrerenderDoneContext['outputDirectories'];
	},
): Promise<AssetEnv> {
	let useCache = true;
	const assetsCacheDir = new URL('assets/', settings.config.cacheDir);
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
		// Read source images from prerender output and write optimized images to client output.
		serverRoot = outputDirectories.prerender;
		clientRoot = outputDirectories.client;
	} else {
		// Static builds move source images to client output before image generation.
		serverRoot = outputDirectories.client;
		clientRoot = outputDirectories.client;
	}

	let imageService: Promise<LocalImageService> | undefined;
	return {
		logger,
		getImageService: () => (imageService ??= loadImageService()),
		referencedImages,
		isSSR: isServerOutput,
		count,
		useCache,
		assetsCacheDir,
		serverRoot,
		clientRoot,
		imageConfig: {
			...settings.config.image,
			service: getImageServiceConfig(settings.config.image.service, 'build'),
		},
		assetsFolder: settings.config.build.assets,
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

	// Delete original images that are only used for optimization
	// The referencedImages set tracks images that were used via raw `src` access (e.g., <img src={img.src}>).
	if (
		transformsAndPath.originalSrcPath &&
		!env.referencedImages.has(transformsAndPath.originalSrcPath)
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
		recordTiming('image', filepath, timeEnd - timeStart, {
			cached: generationData.cached !== 'miss',
		});
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
				await copyCachedFile(cachedFileURL, finalFileURL);

				return {
					cached: 'hit',
				};
			} else {
				const JSONData = JSON.parse(readFileSync(cachedMetaFileURL, 'utf-8')) as RemoteCacheEntry;

				if (typeof JSONData.expires !== 'number') {
					await Promise.allSettled([
						fs.promises.unlink(cachedFileURL),
						fs.promises.unlink(cachedMetaFileURL),
					]);

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
					await copyCachedFile(cachedFileURL, finalFileURL);

					return { cached: 'hit' };
				}

				// Try to revalidate the cache
				if (JSONData.etag || JSONData.lastModified) {
					try {
						const revalidatedData = await revalidateRemoteImage(options.src as string, {
							etag: JSONData.etag,
							lastModified: JSONData.lastModified,
						});

						if (revalidatedData.data !== null) {
							// Image cache was stale, update original image to avoid redownload
							originalImage = revalidatedData as ImageData;
						} else {
							// Freshen cache on disk and output cached image
							await Promise.all([
								writeCacheMetaFile(cachedMetaFileURL, revalidatedData, env),
								copyCachedFile(cachedFileURL, finalFileURL),
							]);

							return { cached: 'revalidated' };
						}
					} catch (e) {
						// Reuse stale cache if revalidation fails
						env.logger.warn(
							null,
							`An error was encountered while revalidating a cached remote asset. Proceeding with stale cache. ${e}`,
						);

						await copyCachedFile(cachedFileURL, finalFileURL);
						return { cached: 'hit' };
					}
				}

				await Promise.allSettled([
					fs.promises.unlink(cachedFileURL),
					fs.promises.unlink(cachedMetaFileURL),
				]);
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

		const imageService = await env.getImageService();

		try {
			resultData.data = (
				await imageService.transform(
					originalImage.data,
					{ ...options, src: originalImagePath },
					env.imageConfig,
					astroToRuntimeLogger(env.logger),
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
			'utf-8',
		);
	} catch (e) {
		env.logger.warn(
			null,
			`An error was encountered while writing the cache file for a remote asset. Proceeding without caching this asset. Error: ${e}`,
		);
	}
}

export class StaticImageRegistry {
	readonly images: AssetsGlobalStaticImagesList = new Map();
	readonly referencedImages = new Set<string>();

	addStaticImages(images: Iterable<SerializedStaticImage> | undefined): void {
		if (!images) return;
		for (const image of images) {
			let transformsForPath = this.images.get(image.originalPath);
			if (!transformsForPath) {
				transformsForPath = { originalSrcPath: image.originalSrcPath, transforms: new Map() };
				this.images.set(image.originalPath, transformsForPath);
			}
			if (!transformsForPath.transforms.has(image.hash)) {
				transformsForPath.transforms.set(image.hash, {
					finalPath: image.finalPath,
					transform: image.transform,
				});
			}
		}
	}

	addReferencedImages(fsPaths: Iterable<string> | undefined): void {
		if (!fsPaths) return;
		for (const fsPath of fsPaths) {
			this.referencedImages.add(fsPath);
		}
	}

	addMetadata(
		metadata: { staticImages?: SerializedStaticImage[]; referencedImages?: string[] } | undefined,
	): void {
		this.addStaticImages(metadata?.staticImages);
		this.addReferencedImages(metadata?.referencedImages);
	}

	addStaticImageList(list: AssetsGlobalStaticImagesList): void {
		for (const [originalPath, { originalSrcPath, transforms }] of list) {
			this.addStaticImages(
				Array.from(transforms, ([hash, { finalPath, transform }]) => ({
					originalPath,
					originalSrcPath,
					hash,
					finalPath,
					transform,
				})),
			);
		}
	}
}

async function loadImage(path: string, env: AssetEnv): Promise<ImageData> {
	if (isRemotePath(path)) {
		return await loadRemoteImage(path, undefined, env.imageConfig);
	}

	return {
		data: await fs.promises.readFile(getFullImagePath(path, env)),
		expires: 0,
	};
}

/**
 * Generates the optimized images the prerendered pages recorded, the ones restored from the
 * incremental build cache (`images`) and the ones the prerenderer collected in its own runtime.
 * Registered with `api.astroRouter.onPrerenderDone()`.
 */
export async function generateStaticImages(
	{ settings, logger }: { settings: AstroSettings; logger: AstroLogger },
	{
		prerenderer,
		metadata,
		builder,
		outputDirectories,
	}: PrerenderDoneContext & { prerenderer: AstroPrerenderer | undefined },
	images: StaticImageRegistry,
): Promise<void> {
	if (!prerenderer) return;

	images.addReferencedImages(getAssetsPluginApi(builder.config.plugins)?.referencedImages);
	for (const entry of metadata) images.addMetadata(entry);
	// Must happen before teardown since collectStaticImages fetches from the prerender server
	if (prerenderer.collectStaticImages) {
		images.addStaticImageList(await prerenderer.collectStaticImages());
	}
	const staticImageList = images.images;
	if (!staticImageList.size) return;

	logger.info('SKIP_FORMAT', `${colors.bgGreen(colors.black(` generating optimized images `))}`);

	const totalCount = Array.from(staticImageList.values())
		.map((x) => x.transforms.size)
		.reduce((a, b) => a + b, 0);
	const cpuCount = os.availableParallelism();
	const assetsCreationPipeline = await prepareAssetsGenerationEnv(
		{ settings, logger },
		totalCount,
		{
			loadImageService: () => loadBuildImageService(builder, settings),
			referencedImages: images.referencedImages,
			outputDirectories,
		},
	);
	const queue = new PQueue({ concurrency: Math.max(cpuCount, 1) });
	const errors: Error[] = [];

	const assetsTimer = performance.now();
	for (const [originalPath, transforms] of staticImageList) {
		// Process each source image in parallel based on the queue’s concurrency
		// (`cpuCount`). Process each transform for a source image sequentially.
		//
		// # Design Decision:
		// We have 3 source images (A.png, B.png, C.png) and 3 transforms for
		// each:
		// ```
		// A1.png A2.png A3.png
		// B1.png B2.png B3.png
		// C1.png C2.png C3.png
		// ```
		//
		// ## Option 1
		// Enqueue all transforms indiscriminantly
		// ```
		// |_A1.png   |_B2.png   |_C1.png
		// |_B3.png   |_A2.png   |_C3.png
		// |_C2.png   |_A3.png   |_B1.png
		// ```
		// * Advantage: Maximum parallelism, saturate CPU
		// * Disadvantage: Spike in context switching
		//
		// ## Option 2
		// Enqueue all transforms, but constrain processing order by source image
		// ```
		// |_A3.png   |_B1.png   |_C2.png
		// |_A1.png   |_B3.png   |_C1.png
		// |_A2.png   |_B2.png   |_C3.png
		// ```
		// * Advantage: Maximum parallelism, saturate CPU (same as Option 1) in
		//   hope to avoid context switching
		// * Disadvantage: Context switching still occurs and performance still
		//   suffers
		//
		// ## Option 3
		// Enqueue each source image, but perform the transforms for that source
		// image sequentially
		// ```
		// \_A1.png   \_B1.png   \_C1.png
		//  \_A2.png   \_B2.png   \_C2.png
		//   \_A3.png   \_B3.png   \_C3.png
		// ```
		// * Advantage: Less context switching
		// * Disadvantage: If you have a low number of source images with high
		//   number of transforms then this is suboptimal.
		//
		// ## BEST OPTION:
		// **Option 3**. Most projects will have a higher number of source images
		// with a few transforms on each. Even though Option 2 should be faster
		// and _should_ prevent context switching, this was not observed in
		// nascent tests. Context switching was high and the overall performance
		// was half of Option 3.
		//
		// If looking to optimize further, please consider the following:
		// * Avoid `queue.add()` in an async for loop. Notice the `await
		//   queue.onIdle();` after this loop. We do not want to create a scenario
		//   where tasks are added to the queue after the queue.onIdle() resolves.
		//   This can break tests and create annoying race conditions.
		// * Exposing a concurrency property in `astro.config.mjs` to allow users
		//   to override Node’s os.availableParallelism() default.
		// * Create a proper performance benchmark for asset transformations of
		//   projects in varying sizes of source images and transforms.
		queue
			.add(() => generateImagesForPath(originalPath, transforms, assetsCreationPipeline))
			.catch((e) => {
				logger.warn('build', `Unable to generate optimized image for ${originalPath}: ${e}`);
				errors.push(new Error(`Error generating image for ${originalPath}: ${e}`, { cause: e }));
			});
	}

	await queue.onIdle();
	if (errors.length === 1) {
		throw errors[0];
	} else if (errors.length > 1) {
		throw new AggregateError(errors, `${errors.length} errors occurred during asset generation`);
	}

	const assetsTimeEnd = performance.now();
	logger.info(null, colors.green(`✓ Completed in ${getTimeStat(assetsTimer, assetsTimeEnd)}.\n`));
}
