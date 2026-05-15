import fs, { readFileSync } from 'node:fs';
import { basename } from 'node:path/posix';
import colors from 'piccolore';
import { getOutDirWithinCwd } from '../../core/build/common.js';
import { getTimeStat } from '../../core/build/util.js';
import { AstroError } from '../../core/errors/errors.js';
import { AstroErrorData } from '../../core/errors/index.js';
import { isRemotePath, removeLeadingForwardSlash } from '../../core/path.js';
import { getConfiguredImageService } from '../internal.js';
import { isESMImportedImage } from '../utils/imageKind.js';
import { loadRemoteImage, revalidateRemoteImage } from './remote.js';
async function prepareAssetsGenerationEnv(options, totalCount) {
	const { settings, logger } = options;
	let useCache = true;
	const assetsCacheDir = new URL('assets/', settings.config.cacheDir);
	const count = { total: totalCount, current: 1 };
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
	let serverRoot, clientRoot;
	if (isServerOutput) {
		serverRoot = new URL('.prerender/', settings.config.build.server);
		clientRoot = settings.config.build.client;
	} else {
		serverRoot = getOutDirWithinCwd(settings.config.outDir);
		clientRoot = settings.config.outDir;
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
		assetsFolder: settings.config.build.assets,
	};
}
function getFullImagePath(originalFilePath, env) {
	return new URL(removeLeadingForwardSlash(originalFilePath), env.serverRoot);
}
async function generateImagesForPath(originalFilePath, transformsAndPath, env) {
	let originalImage;
	for (const [_, transform] of transformsAndPath.transforms) {
		await generateImage(transform.finalPath, transform.transform);
	}
	if (
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
		} catch {}
	}
	async function generateImage(filepath, options) {
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
			`  ${colors.green('\u25B6')} ${filepath} ${colors.dim(statsText)} ${colors.dim(timeIncrease)} ${colors.dim(count)}`,
		);
		env.count.current++;
	}
	async function generateImageInternal(filepath, options) {
		const isLocalImage = isESMImportedImage(options.src);
		const finalFileURL = new URL('.' + filepath, env.clientRoot);
		const finalFolderURL = new URL('./', finalFileURL);
		await fs.promises.mkdir(finalFolderURL, { recursive: true });
		const cacheFile = basename(filepath);
		const cachedFileURL = new URL(cacheFile, env.assetsCacheDir);
		const cacheMetaFile = cacheFile + '.json';
		const cachedMetaFileURL = new URL(cacheMetaFile, env.assetsCacheDir);
		try {
			if (isLocalImage) {
				await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);
				return {
					cached: 'hit',
				};
			} else {
				const JSONData = JSON.parse(readFileSync(cachedMetaFileURL, 'utf-8'));
				if (typeof JSONData.expires !== 'number') {
					await Promise.allSettled([
						fs.promises.unlink(cachedFileURL),
						fs.promises.unlink(cachedMetaFileURL),
					]);
					throw new Error(
						`Malformed cache entry for ${filepath}, cache will be regenerated for this file.`,
					);
				}
				if (JSONData.data) {
					const { data, ...meta } = JSONData;
					await Promise.all([
						fs.promises.writeFile(cachedFileURL, Buffer.from(data, 'base64')),
						writeCacheMetaFile(cachedMetaFileURL, meta, env),
					]);
				}
				if (JSONData.expires > Date.now()) {
					await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);
					return { cached: 'hit' };
				}
				if (JSONData.etag || JSONData.lastModified) {
					try {
						const revalidatedData = await revalidateRemoteImage(options.src, {
							etag: JSONData.etag,
							lastModified: JSONData.lastModified,
						});
						if (revalidatedData.data !== null) {
							originalImage = revalidatedData;
						} else {
							await Promise.all([
								writeCacheMetaFile(cachedMetaFileURL, revalidatedData, env),
								fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE),
							]);
							return { cached: 'revalidated' };
						}
					} catch (e) {
						env.logger.warn(
							null,
							`An error was encountered while revalidating a cached remote asset. Proceeding with stale cache. ${e}`,
						);
						await fs.promises.copyFile(cachedFileURL, finalFileURL, fs.constants.COPYFILE_FICLONE);
						return { cached: 'hit' };
					}
				}
				await Promise.allSettled([
					fs.promises.unlink(cachedFileURL),
					fs.promises.unlink(cachedMetaFileURL),
				]);
			}
		} catch (e) {
			if (e.code !== 'ENOENT') {
				throw new Error(`An error was encountered while reading the cache file. Error: ${e}`);
			}
		}
		const originalImagePath = isLocalImage ? options.src.src : options.src;
		if (!originalImage) {
			originalImage = await loadImage(originalFilePath, env);
		}
		let resultData = {
			data: void 0,
			expires: originalImage.expires,
			etag: originalImage.etag,
			lastModified: originalImage.lastModified,
		};
		const imageService = await getConfiguredImageService();
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
			if (env.useCache) {
				if (isLocalImage) {
					await fs.promises.writeFile(cachedFileURL, resultData.data);
				} else {
					await Promise.all([
						fs.promises.writeFile(cachedFileURL, resultData.data),
						writeCacheMetaFile(cachedMetaFileURL, resultData, env),
					]);
				}
			}
		} catch (e) {
			env.logger.warn(
				null,
				`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${e}`,
			);
		} finally {
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
async function writeCacheMetaFile(cachedMetaFileURL, resultData, env) {
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
function getStaticImageList() {
	if (!globalThis?.astroAsset?.staticImages) {
		return /* @__PURE__ */ new Map();
	}
	return globalThis.astroAsset.staticImages;
}
async function loadImage(path, env) {
	if (isRemotePath(path)) {
		return await loadRemoteImage(path, void 0, env.imageConfig);
	}
	return {
		data: await fs.promises.readFile(getFullImagePath(path, env)),
		expires: 0,
	};
}
export { generateImagesForPath, getStaticImageList, prepareAssetsGenerationEnv };
