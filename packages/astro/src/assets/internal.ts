import fs from 'node:fs';
import { basename, join } from 'node:path/posix';
import type { StaticBuildOptions } from '../core/build/types.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { prependForwardSlash } from '../core/path.js';
import { isLocalService, type ImageService, type LocalImageService } from './services/service.js';
import type { GetImageResult, ImageMetadata, ImageTransform } from './types.js';

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export async function getConfiguredImageService(): Promise<ImageService> {
	if (!globalThis?.astroAsset?.imageService) {
		const { default: service }: { default: ImageService } = await import(
			// @ts-expect-error
			'virtual:image-service'
		).catch((e) => {
			const error = new AstroError(AstroErrorData.InvalidImageService);
			(error as any).cause = e;
			throw error;
		});

		if (!globalThis.astroAsset) globalThis.astroAsset = {};
		globalThis.astroAsset.imageService = service;
		return service;
	}

	return globalThis.astroAsset.imageService;
}

export async function getImage(
	options: ImageTransform,
	serviceConfig: Record<string, any>
): Promise<GetImageResult> {
	if (!options || typeof options !== 'object') {
		throw new AstroError({
			...AstroErrorData.ExpectedImageOptions,
			message: AstroErrorData.ExpectedImageOptions.message(JSON.stringify(options)),
		});
	}

	const service = await getConfiguredImageService();
	const validatedOptions = service.validateOptions
		? service.validateOptions(options, serviceConfig)
		: options;

	let imageURL = service.getURL(validatedOptions, serviceConfig);

	// In build and for local services, we need to collect the requested parameters so we can generate the final images
	if (isLocalService(service) && globalThis.astroAsset.addStaticImage) {
		imageURL = globalThis.astroAsset.addStaticImage(validatedOptions);
	}

	return {
		rawOptions: options,
		options: validatedOptions,
		src: imageURL,
		attributes:
			service.getHTMLAttributes !== undefined
				? service.getHTMLAttributes(validatedOptions, serviceConfig)
				: {},
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
	if (!isESMImportedImage(options.src)) {
		return undefined;
	}

	let useCache = true;
	const assetsCacheDir = new URL('assets/', buildOpts.settings.config.cacheDir);

	// Ensure that the cache directory exists
	try {
		await fs.promises.mkdir(assetsCacheDir, { recursive: true });
	} catch (err) {
		console.error(
			'An error was encountered while creating the cache directory. Proceeding without caching. Error: ',
			err
		);
		useCache = false;
	}

	let serverRoot: URL, clientRoot: URL;
	if (buildOpts.settings.config.output === 'server') {
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
			console.error(
				`There was an error creating the cache entry for ${filepath}. Attempting to write directly to output directory. Error: `,
				e
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
