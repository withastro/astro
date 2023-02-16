import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { ImageService } from './services/service.js';
import type { ImageMetadata, ImageTransform } from './types.js';

export function isRemoteImage(src: string) {
	return /^(https?:)?\/\//.test(src);
}

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export async function getConfiguredService(): Promise<ImageService> {
	if (!globalThis.astroImageService) {
		const { default: service }: { default: ImageService } = await import(
			// @ts-ignore
			'virtual:image-service'
		).catch((e) => {
			const error = new AstroError(AstroErrorData.InvalidImageService);
			(error as any).cause = e;
			throw error;
		});

		globalThis.astroImageService = service;
		return service;
	}

	return globalThis.astroImageService;
}

interface getImageResult {
	options: ImageTransform;
	src: string;
	attributes: Record<string, any>;
}

export async function getImage(options: ImageTransform): Promise<getImageResult> {
	const service = await getConfiguredService();
	if (service.validateTransform) options = service.validateTransform(options);

	return {
		options,
		src: service.getURL(options),
		attributes: service.getHTMLAttributes !== undefined ? service.getHTMLAttributes(options) : {},
	};
}
