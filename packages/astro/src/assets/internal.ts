import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assetMagicStringToFileURL } from './utils/emitAsset.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { isLocalService, type ImageService } from './services/service.js';
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


export async function readImageFile(src: ImageMetadata, serverRootURL: URL): Promise<Buffer> {
	const assetUrlRE = /^__ASTRO_ASSET_IMAGE__([a-z\d]{8})__$/;

	let fileURL: URL | undefined;

	if (src.src.match(assetUrlRE)) {
		// If it is a MagicString not yet replaced by Vite, fetch the original URL from memory.
		fileURL = assetMagicStringToFileURL(src.src)
	} else if (src.src.startsWith('/@fs')) {
		// If it is a transformed URL from the dev server, fetch the path from the URL
		fileURL = new URL('.' + src.src.slice('/@fs'.length), 'file:');
	} else if (src.src.startsWith('/')) {
		// If it is a URL starting at the serverRootURL
		fileURL = new URL(`./${src.src}`, serverRootURL);
	} else {
		// Resolve full url in all other cases
		fileURL = new URL(`./${src.src}`, serverRootURL);
	}

	if (fileURL === undefined) {
		throw new Error(`Unable to read image file "${src.src}".`);
	}

	if (fileURL.protocol === 'file:') {
		return fs.readFile(fileURLToPath(fileURL));
	}

	const res = await fetch(fileURL);

	if (!res.ok) {
		throw new Error(`Received code ${res.status} when fetching remote image.`)
	}

	return Buffer.from(await res.arrayBuffer());
}
