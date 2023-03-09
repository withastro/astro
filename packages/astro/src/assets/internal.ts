import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { AstroSettings } from '../@types/astro.js';
import { StaticBuildOptions } from '../core/build/types.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { rootRelativePath } from '../core/util.js';
import { ImageService, isLocalService, LocalImageService } from './services/service.js';
import type { ImageMetadata, ImageTransform } from './types.js';
import { imageMetadata } from './utils/metadata.js';

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export async function getConfiguredImageService(): Promise<ImageService> {
	if (!globalThis.astroAsset.imageService) {
		const { default: service }: { default: ImageService } = await import(
			// @ts-expect-error
			'virtual:image-service'
		).catch((e) => {
			const error = new AstroError(AstroErrorData.InvalidImageService);
			(error as any).cause = e;
			throw error;
		});

		globalThis.astroAsset.imageService = service;
		return service;
	}

	return globalThis.astroAsset.imageService;
}

interface GetImageResult {
	options: ImageTransform;
	src: string;
	attributes: Record<string, any>;
}

/**
 * Get an optimized image and the necessary attributes to render it.
 *
 * **Example**
 * ```astro
 * ---
 * import { getImage } from 'astro:assets';
 * import originalImage from '../assets/image.png';
 *
 * const optimizedImage = await getImage({src: originalImage, width: 1280 })
 * ---
 * <img src={optimizedImage.src} {...optimizedImage.attributes} />
 * ```
 *
 * This is functionally equivalent to using the `<Image />` component, as the component calls this function internally.
 */
export async function getImage(options: ImageTransform): Promise<GetImageResult> {
	const service = await getConfiguredImageService();
	let imageURL = service.getURL(options);

	// In build and for local services, we need to collect the requested parameters so we can generate the final images
	if (isLocalService(service) && globalThis.astroAsset.addStaticImage) {
		imageURL = globalThis.astroAsset.addStaticImage(options);
	}

	return {
		options,
		src: imageURL,
		attributes: service.getHTMLAttributes !== undefined ? service.getHTMLAttributes(options) : {},
	};
}

export function getStaticImageList(): Iterable<[ImageTransform, string]> {
	if (!globalThis?.astroAsset?.staticImages) {
		return [];
	}

	return globalThis.astroAsset.staticImages?.entries();
}

interface GenerationData {
	weight: {
		before: number;
		after: number;
	};
}

export async function generateImage(
	buildOpts: StaticBuildOptions,
	options: ImageTransform,
	filepath: string
): Promise<GenerationData | undefined> {
	if (!isESMImportedImage(options.src)) {
		return undefined;
	}

	const imageService = (await getConfiguredImageService()) as LocalImageService;

	let serverRoot: URL, clientRoot: URL;
	if (buildOpts.settings.config.output === 'server') {
		serverRoot = buildOpts.settings.config.build.server;
		clientRoot = buildOpts.settings.config.build.client;
	} else {
		serverRoot = buildOpts.settings.config.outDir;
		clientRoot = buildOpts.settings.config.outDir;
	}

	const fileData = await fs.promises.readFile(new URL('.' + options.src.src, serverRoot));
	const resultData = await imageService.transform(fileData, { ...options, src: options.src.src });

	const finalFileURL = new URL('.' + filepath, clientRoot);
	const finalFolderURL = new URL('./', finalFileURL);

	await fs.promises.mkdir(finalFolderURL, { recursive: true });
	await fs.promises.writeFile(finalFileURL, resultData.data);

	return {
		weight: {
			before: Math.trunc(fileData.byteLength / 1024),
			after: Math.trunc(resultData.data.byteLength / 1024),
		},
	};
}

export async function emitESMImage(
	id: string,
	watchMode: boolean,
	fileEmitter: any,
	settings: AstroSettings
) {
	const url = pathToFileURL(id);
	const meta = await imageMetadata(url);

	if (!meta) {
		return;
	}

	// Build
	if (!watchMode) {
		const pathname = decodeURI(url.pathname);
		const filename = path.basename(pathname, path.extname(pathname) + `.${meta.format}`);

		const handle = fileEmitter({
			name: filename,
			source: await fs.promises.readFile(url),
			type: 'asset',
		});

		meta.src = `__ASTRO_ASSET_IMAGE__${handle}__`;
	} else {
		// Pass the original file information through query params so we don't have to load the file twice
		url.searchParams.append('origWidth', meta.width.toString());
		url.searchParams.append('origHeight', meta.height.toString());
		url.searchParams.append('origFormat', meta.format);

		meta.src = rootRelativePath(settings.config, url);
	}

	return meta;
}
