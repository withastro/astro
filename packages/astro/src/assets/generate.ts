import fs from 'node:fs';
import { basename, join } from 'node:path/posix';
import type { StaticBuildOptions } from '../core/build/types.js';
import { warn } from '../core/logger/core.js';
import { prependForwardSlash } from '../core/path.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { getConfiguredImageService, isESMImportedImage } from './internal.js';
import type { LocalImageService } from './services/service.js';
import type { ImageTransform } from './types.js';

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
	if (typeof buildOpts.settings.config.image === 'undefined') {
		throw new Error(
			"Astro hasn't set a default service for `astro:assets`. This is an internal error and you should report it."
		);
	}
	if (!isESMImportedImage(options.src)) {
		return undefined;
	}

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
	const cachedFileURL = new URL(basename(filepath), assetsCacheDir);

	try {
		await fs.promises.copyFile(cachedFileURL, finalFileURL);

		return {
			cached: true,
		};
	} catch (e) {
		// no-op
	}

	// The original file's path (the `src` attribute of the ESM imported image passed by the user)
	const originalImagePath = options.src.src;

	const fileData = await fs.promises.readFile(
		new URL(
			'.' +
				prependForwardSlash(
					join(buildOpts.settings.config.build.assets, basename(originalImagePath))
				),
			serverRoot
		)
	);

	const imageService = (await getConfiguredImageService()) as LocalImageService;
	const resultData = await imageService.transform(
		fileData,
		{ ...options, src: originalImagePath },
		buildOpts.settings.config.image.service.config
	);

	await fs.promises.mkdir(finalFolderURL, { recursive: true });

	if (useCache) {
		try {
			await fs.promises.writeFile(cachedFileURL, resultData.data);
			await fs.promises.copyFile(cachedFileURL, finalFileURL);
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
			before: Math.trunc(fileData.byteLength / 1024),
			after: Math.trunc(resultData.data.byteLength / 1024),
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
