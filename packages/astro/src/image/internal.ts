import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { ImageService, isLocalService } from './services/service.js';
import type { ImageMetadata, ImageTransform } from './types.js';

export function isRemoteImage(src: string) {
	return /^(https?:)?\/\//.test(src);
}

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

async function getConfiguredService(): Promise<ImageService> {
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

function validateOptions(options: ImageTransform) {
	if (!isESMImportedImage(options.src)) {
		// For non-ESM imported images, width and height are required to avoid CLS, as we can't infer them from the file
		let missingDimension: 'width' | 'height' | 'both' | undefined;
		if (!options.width && !options.height) {
			missingDimension = 'both';
		} else if (!options.width && options.height) {
			missingDimension = 'width';
		} else if (options.width && !options.height) {
			missingDimension = 'height';
		}

		if (missingDimension) {
			throw new AstroError({
				...AstroErrorData.MissingImageDimension,
				message: AstroErrorData.MissingImageDimension.message(missingDimension),
			});
		}
	}

	return options;
}

export async function getImage(options: ImageTransform) {
	const service = await getConfiguredService();
	options = validateOptions(options);

	// If the currently configured service points to an external URL, we can return early and let it
	// handle all the work
	if (!isLocalService(service)) {
		return {
			src: service.getURL(options),
			width: options.width,
			height: options.height,
			...(service.getAdditionalAttributes !== undefined
				? service.getAdditionalAttributes(options)
				: []),
		};
	}

	return {
		...options,
		src: service.getURL(options),
	};
}
