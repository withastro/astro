import type { AstroConfig } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { isLocalService, type ImageService } from './services/service.js';
import type { GetImageResult, ImageMetadata, ImageTransform } from './types.js';
import { matchPattern, matchHostname } from './utils/remotePattern.js';

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export function isRemoteImage(src: ImageMetadata | string): src is string {
	return typeof src === 'string';
}

export function isRemoteAllowed(
	src: string,
	{
		domains = [],
		remotePatterns = [],
	}: Partial<Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>>
) {
	const url = new URL(src);

	return (
		domains.some((domain) => matchHostname(url, domain)) ||
		remotePatterns.some((remotePattern) => matchPattern(url, remotePattern))
	);
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
	serviceConfig: Record<string, any>,
	assetsConfig: AstroConfig['image']
): Promise<GetImageResult> {
	if (!options || typeof options !== 'object') {
		throw new AstroError({
			...AstroErrorData.ExpectedImageOptions,
			message: AstroErrorData.ExpectedImageOptions.message(JSON.stringify(options)),
		});
	}

	const service = await getConfiguredImageService();
	const validatedOptions = service.validateOptions
		? await service.validateOptions(options, serviceConfig)
		: options;

	let imageURL = await service.getURL(validatedOptions, serviceConfig, assetsConfig);

	// In build and for local services, we need to collect the requested parameters so we can generate the final images
	if (isLocalService(service) && globalThis.astroAsset.addStaticImage) {
		imageURL = await globalThis.astroAsset.addStaticImage(validatedOptions);
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
