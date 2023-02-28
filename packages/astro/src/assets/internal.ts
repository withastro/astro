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
	if (!globalThis.astroAsset.imageService) {
		const { default: service }: { default: ImageService } = await import(
			// @ts-ignore
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

interface getImageResult {
	options: ImageTransform;
	src: string;
	attributes: Record<string, any>;
}

export async function getImage(options: ImageTransform): Promise<getImageResult> {
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

export function getStaticImageList() {
	if (!globalThis.astroAsset.staticImages) {
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

	const fileData = await fs.promises.readFile(
		path.join(buildOpts.settings.config.outDir.pathname, options.src.src)
	);
	const resultData = await imageService.transform(fileData, options);

	const finalFilepath = path.join(buildOpts.settings.config.outDir.pathname, filepath);
	await fs.promises.writeFile(finalFilepath, resultData.data);

	return {
		weight: {
			before: Math.trunc(fileData.byteLength / 1024),
			after: Math.trunc(resultData.data.byteLength / 1024),
		},
	};
}
