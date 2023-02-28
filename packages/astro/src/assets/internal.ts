import fs from 'node:fs';
import path from 'node:path';
import { StaticBuildOptions } from '../core/build/types.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { ImageService, isLocalService, LocalImageService } from './services/service.js';
import type { ImageMetadata, ImageTransform } from './types.js';

export function isRemoteImage(src: string) {
	return /^(https?:)?\/\//.test(src);
}

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export async function getConfiguredImageService(): Promise<ImageService> {
	if (!globalThis.astroImage.imageService) {
		const { default: service }: { default: ImageService } = await import(
			// @ts-ignore
			'virtual:image-service'
		).catch((e) => {
			const error = new AstroError(AstroErrorData.InvalidImageService);
			(error as any).cause = e;
			throw error;
		});

		globalThis.astroImage.imageService = service;
		return service;
	}

	return globalThis.astroImage.imageService;
}

interface getImageResult {
	options: ImageTransform;
	src: string;
	attributes: Record<string, any>;
}

export async function getImage(options: ImageTransform): Promise<getImageResult> {
	const service = await getConfiguredImageService();
	let imageURL = service.getURL(options);

	// In build and for local services, we need to collect the requested parameters so we can generate the final images
	if (isLocalService(service) && globalThis.astroImage.addStaticImage) {
		imageURL = globalThis.astroImage.addStaticImage(options);
	}

	return {
		options,
		src: imageURL,
		attributes: service.getHTMLAttributes !== undefined ? service.getHTMLAttributes(options) : {},
	};
}

export function getStaticImageList() {
	if (!globalThis.astroImage.staticImages) {
		return [];
	}

	return globalThis.astroImage.staticImages?.entries();
}

export async function generateImage(
	buildOpts: StaticBuildOptions,
	options: ImageTransform,
	filepath: string
) {
	const imageService = (await getConfiguredImageService()) as LocalImageService;

	if (!isESMImportedImage(options.src)) {
		return;
	}

	const fileData = await fs.promises.readFile(
		path.join(buildOpts.settings.config.outDir.pathname, options.src.src)
	);
	const resultData = await imageService.transform(fileData, options);

	const finalFilepath = path.join(buildOpts.settings.config.outDir.pathname, filepath);
	await fs.promises.writeFile(finalFilepath, resultData.data);
}
