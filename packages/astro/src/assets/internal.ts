import { isRemotePath } from '@astrojs/internal-helpers/path';
import type { AstroConfig, AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { isLocalService, type ImageService } from './services/service.js';
import type {
	GetImageResult,
	ImageMetadata,
	ImageTransform,
	UnresolvedImageTransform,
} from './types.js';
import { matchHostname, matchPattern } from './utils/remotePattern.js';

export function injectImageEndpoint(settings: AstroSettings) {
	// TODO: Add a setting to disable the image endpoint
	settings.injectedRoutes.push({
		pattern: '/_image',
		entryPoint: 'astro/assets/image-endpoint',
		prerender: false,
	});

	return settings;
}

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
): boolean {
	if (!isRemotePath(src)) return false;

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
	options: ImageTransform | UnresolvedImageTransform,
	imageConfig: AstroConfig['image']
): Promise<GetImageResult> {
	if (!options || typeof options !== 'object') {
		throw new AstroError({
			...AstroErrorData.ExpectedImageOptions,
			message: AstroErrorData.ExpectedImageOptions.message(JSON.stringify(options)),
		});
	}

	const service = await getConfiguredImageService();

	// If the user inlined an import, something fairly common especially in MDX, or passed a function that returns an Image, await it for them
	const resolvedOptions: ImageTransform = {
		...options,
		src:
			typeof options.src === 'object' && 'then' in options.src
				? (await options.src).default ?? (await options.src)
				: options.src,
	};

	const validatedOptions = service.validateOptions
		? await service.validateOptions(resolvedOptions, imageConfig)
		: resolvedOptions;

	let imageURL = await service.getURL(validatedOptions, imageConfig);

	// In build and for local services, we need to collect the requested parameters so we can generate the final images
	if (
		isLocalService(service) &&
		globalThis.astroAsset.addStaticImage &&
		// If `getURL` returned the same URL as the user provided, it means the service doesn't need to do anything
		!(isRemoteImage(validatedOptions.src) && imageURL === validatedOptions.src)
	) {
		imageURL = globalThis.astroAsset.addStaticImage(validatedOptions);
	}

	return {
		rawOptions: resolvedOptions,
		options: validatedOptions,
		src: imageURL,
		attributes:
			service.getHTMLAttributes !== undefined
				? service.getHTMLAttributes(validatedOptions, imageConfig)
				: {},
	};
}
