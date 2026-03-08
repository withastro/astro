import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroConfig } from '../types/public/config.js';
import type { AstroAdapterClientConfig } from '../types/public/integrations.js';
import { DEFAULT_HASH_PROPS } from './consts.js';
import {
	DEFAULT_RESOLUTIONS,
	getSizesAttribute,
	getWidths,
	LIMITED_RESOLUTIONS,
} from './layout.js';
import { type ImageService, isLocalService } from './services/service.js';
import {
	type GetImageResult,
	type ImageTransform,
	isImageMetadata,
	type SrcSetValue,
	type UnresolvedImageTransform,
} from './types.js';
import { isESMImportedImage, isRemoteImage, resolveSrc } from './utils/imageKind.js';
import { inferRemoteSize } from './utils/remoteProbe.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from './utils/url.js';

export const cssFitValues = ['fill', 'contain', 'cover', 'scale-down'];

export async function getConfiguredImageService(): Promise<ImageService> {
	if (!globalThis?.astroAsset?.imageService) {
		const { default: service }: { default: ImageService } = await import(
			// @ts-expect-error
			'virtual:image-service'
		).catch((e) => {
			const error = new AstroError(AstroErrorData.InvalidImageService);
			error.cause = e;
			throw error;
		});

		if (!globalThis.astroAsset) globalThis.astroAsset = {};
		globalThis.astroAsset.imageService = service;
		return service;
	}

	return globalThis.astroAsset.imageService;
}

export async function getImage(
	options: UnresolvedImageTransform,
	imageConfig: AstroConfig['image'] & AstroAdapterClientConfig,
): Promise<GetImageResult> {
	if (!options || typeof options !== 'object') {
		throw new AstroError({
			...AstroErrorData.ExpectedImageOptions,
			message: AstroErrorData.ExpectedImageOptions.message(JSON.stringify(options)),
		});
	}
	if (typeof options.src === 'undefined') {
		throw new AstroError({
			...AstroErrorData.ExpectedImage,
			message: AstroErrorData.ExpectedImage.message(
				options.src,
				'undefined',
				JSON.stringify(options),
			),
		});
	}

	if (isImageMetadata(options)) {
		throw new AstroError(AstroErrorData.ExpectedNotESMImage);
	}

	const service = await getConfiguredImageService();

	// If the user inlined an import, something fairly common especially in MDX, or passed a function that returns an Image, await it for them
	const resolvedOptions: ImageTransform = {
		...options,
		src: await resolveSrc(options.src),
	};

	let originalWidth: number | undefined;
	let originalHeight: number | undefined;

	// Infer size for remote images if inferSize is true
	if (resolvedOptions.inferSize) {
		delete resolvedOptions.inferSize; // Delete so it doesn't end up in the attributes

		if (isRemoteImage(resolvedOptions.src) && isRemotePath(resolvedOptions.src)) {
			if (!isRemoteAllowed(resolvedOptions.src, imageConfig)) {
				throw new AstroError({
					...AstroErrorData.RemoteImageNotAllowed,
					message: AstroErrorData.RemoteImageNotAllowed.message(resolvedOptions.src),
				});
			}

			const getRemoteSize = (url: string) =>
				service.getRemoteSize?.(url, imageConfig) ?? inferRemoteSize(url, imageConfig);
			const result = await getRemoteSize(resolvedOptions.src); // Directly probe the image URL
			resolvedOptions.width ??= result.width;
			resolvedOptions.height ??= result.height;
			originalWidth = result.width;
			originalHeight = result.height;
		}
	}

	const originalFilePath = isESMImportedImage(resolvedOptions.src)
		? resolvedOptions.src.fsPath
		: undefined; // Only set for ESM imports, where we do have a file path

	// Clone the `src` object if it's an ESM import so that we don't refer to any properties of the original object
	// Causing our generate step to think the image is used outside of the image optimization pipeline
	const clonedSrc = isESMImportedImage(resolvedOptions.src)
		? // @ts-expect-error - clone is a private, hidden prop
			(resolvedOptions.src.clone ?? resolvedOptions.src)
		: resolvedOptions.src;

	if (isESMImportedImage(clonedSrc)) {
		originalWidth = clonedSrc.width;
		originalHeight = clonedSrc.height;
	}

	if (originalWidth && originalHeight) {
		// Calculate any missing dimensions from the aspect ratio, if available
		const aspectRatio = originalWidth / originalHeight;
		if (resolvedOptions.height && !resolvedOptions.width) {
			resolvedOptions.width = Math.round(resolvedOptions.height * aspectRatio);
		} else if (resolvedOptions.width && !resolvedOptions.height) {
			resolvedOptions.height = Math.round(resolvedOptions.width / aspectRatio);
		} else if (!resolvedOptions.width && !resolvedOptions.height) {
			resolvedOptions.width = originalWidth;
			resolvedOptions.height = originalHeight;
		}
	}
	resolvedOptions.src = clonedSrc;

	const layout = options.layout ?? imageConfig.layout ?? 'none';

	if (resolvedOptions.priority) {
		resolvedOptions.loading ??= 'eager';
		resolvedOptions.decoding ??= 'sync';
		resolvedOptions.fetchpriority ??= 'high';
		delete resolvedOptions.priority;
	} else {
		resolvedOptions.loading ??= 'lazy';
		resolvedOptions.decoding ??= 'async';
		// Omit fetchpriority to use the default `"auto"` value
		resolvedOptions.fetchpriority ??= undefined;
	}

	if (layout !== 'none') {
		resolvedOptions.widths ||= getWidths({
			width: resolvedOptions.width,
			layout,
			originalWidth,
			breakpoints: imageConfig.breakpoints?.length
				? imageConfig.breakpoints
				: isLocalService(service)
					? LIMITED_RESOLUTIONS
					: DEFAULT_RESOLUTIONS,
		});
		resolvedOptions.sizes ||= getSizesAttribute({ width: resolvedOptions.width, layout });
		// The densities option is incompatible with the `layout` option
		delete resolvedOptions.densities;

		// Set data attribute for layout
		resolvedOptions['data-astro-image'] = layout;

		// Set data attributes for fit and position for CSP-compliant styling
		if (resolvedOptions.fit && cssFitValues.includes(resolvedOptions.fit)) {
			resolvedOptions['data-astro-image-fit'] = resolvedOptions.fit;
		}

		if (resolvedOptions.position) {
			// Normalize position value for data attribute (spaces to dashes)
			resolvedOptions['data-astro-image-pos'] = resolvedOptions.position.replace(/\s+/g, '-');
		}
	}

	const validatedOptions = service.validateOptions
		? await service.validateOptions(resolvedOptions, imageConfig)
		: resolvedOptions;

	// Get all the options for the different srcSets
	const srcSetTransforms = service.getSrcSet
		? await service.getSrcSet(validatedOptions, imageConfig)
		: [];

	// In the Picture component, the optimized original-sized image is typically not used when `widths` is set.
	// Since `globalThis.astroAsset.addStaticImage()` triggers image generation immediately,
	// we fetch it lazily to avoid creating unnecessary assets.
	const lazyImageURLFactory = (getValue: () => string) => {
		let cached: string | null = null;
		return () => (cached ??= getValue());
	};
	const initialImageURL = await service.getURL(validatedOptions, imageConfig);
	let lazyImageURL = lazyImageURLFactory(() => initialImageURL);

	const matchesValidatedTransform = (transform: ImageTransform) =>
		transform.width === validatedOptions.width &&
		transform.height === validatedOptions.height &&
		transform.format === validatedOptions.format;

	let srcSets: SrcSetValue[] = await Promise.all(
		srcSetTransforms.map(async (srcSet) => {
			return {
				transform: srcSet.transform,
				url: matchesValidatedTransform(srcSet.transform)
					? initialImageURL
					: await service.getURL(srcSet.transform, imageConfig),
				descriptor: srcSet.descriptor,
				attributes: srcSet.attributes,
			};
		}),
	);

	if (
		isLocalService(service) &&
		globalThis.astroAsset.addStaticImage &&
		!(isRemoteImage(validatedOptions.src) && initialImageURL === validatedOptions.src)
	) {
		const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
		lazyImageURL = lazyImageURLFactory(() =>
			globalThis.astroAsset.addStaticImage!(validatedOptions, propsToHash, originalFilePath),
		);
		srcSets = srcSetTransforms.map((srcSet) => {
			return {
				transform: srcSet.transform,
				url: matchesValidatedTransform(srcSet.transform)
					? lazyImageURL()
					: globalThis.astroAsset.addStaticImage!(srcSet.transform, propsToHash, originalFilePath),
				descriptor: srcSet.descriptor,
				attributes: srcSet.attributes,
			};
		});
	} else if (imageConfig.assetQueryParams) {
		// For SSR-rendered images without addStaticImage, append assetQueryParams manually
		const imageURLObj = createPlaceholderURL(initialImageURL);
		imageConfig.assetQueryParams.forEach((value, key) => {
			imageURLObj.searchParams.set(key, value);
		});
		lazyImageURL = lazyImageURLFactory(() => stringifyPlaceholderURL(imageURLObj));

		srcSets = srcSets.map((srcSet) => {
			const urlObj = createPlaceholderURL(srcSet.url);
			imageConfig.assetQueryParams!.forEach((value, key) => {
				urlObj.searchParams.set(key, value);
			});
			return {
				...srcSet,
				url: stringifyPlaceholderURL(urlObj),
			};
		});
	}

	return {
		rawOptions: resolvedOptions,
		options: validatedOptions,
		get src() {
			return lazyImageURL();
		},
		srcSet: {
			values: srcSets,
			attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(', '),
		},
		attributes:
			service.getHTMLAttributes !== undefined
				? await service.getHTMLAttributes(validatedOptions, imageConfig)
				: {},
	};
}
