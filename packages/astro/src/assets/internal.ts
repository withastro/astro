import { isRemotePath } from '@astrojs/internal-helpers/path';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroConfig } from '../types/public/config.js';
import { DEFAULT_HASH_PROPS } from './consts.js';
import { type ImageService, isLocalService } from './services/service.js';
import {
	type GetImageResult,
	type ImageTransform,
	type SrcSetValue,
	type UnresolvedImageTransform,
	isImageMetadata,
} from './types.js';
import { isESMImportedImage, isRemoteImage, resolveSrc } from './utils/imageKind.js';
import { inferRemoteSize } from './utils/remoteProbe.js';
import { getSizes, getWidths } from './layout.js';

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

type ImageConfig = AstroConfig['image'] & {
	experimentalResponsiveImages: boolean;
};

export async function getImage(
	options: UnresolvedImageTransform,
	imageConfig: ImageConfig,
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
	let originalFormat: string | undefined;
	let originalFilePath: string | undefined;

	if (isESMImportedImage(resolvedOptions.src)) {
		originalFilePath = resolvedOptions.src.fsPath;
		originalWidth = resolvedOptions.src.width;
		originalHeight = resolvedOptions.src.height;
		originalFormat = resolvedOptions.src.format;
	}

	// Infer size for remote images if inferSize is true
	if (
		options.inferSize &&
		isRemoteImage(resolvedOptions.src) &&
		isRemotePath(resolvedOptions.src)
	) {
		const result = await inferRemoteSize(resolvedOptions.src); // Directly probe the image URL
		resolvedOptions.width ??= result.width;
		resolvedOptions.height ??= result.height;
		originalWidth = result.width;
		originalHeight = result.height;
		originalFormat = result.format;
		delete resolvedOptions.inferSize; // Delete so it doesn't end up in the attributes
	}

	// Clone the `src` object if it's an ESM import so that we don't refer to any properties of the original object
	// Causing our generate step to think the image is used outside of the image optimization pipeline
	const clonedSrc = isESMImportedImage(resolvedOptions.src)
		? // @ts-expect-error - clone is a private, hidden prop
			(resolvedOptions.src.clone ?? resolvedOptions.src)
		: resolvedOptions.src;

	originalWidth ||= isESMImportedImage(clonedSrc) ? clonedSrc.width : undefined;

	resolvedOptions.src = clonedSrc;

	const layout = options.layout ?? imageConfig.experimentalLayout;

	if (imageConfig.experimentalResponsiveImages && layout) {
		resolvedOptions.widths ||= getWidths({
			width: resolvedOptions.width,
			layout,
			originalWidth,
		});
		resolvedOptions.sizes ||= getSizes({ width: resolvedOptions.width, layout });

		if (resolvedOptions.priority) {
			resolvedOptions.loading ??= 'eager';
			resolvedOptions.decoding ??= 'sync';
			resolvedOptions.fetchpriority ??= 'high';
		} else {
			resolvedOptions.loading ??= 'lazy';
			resolvedOptions.decoding ??= 'async';
			resolvedOptions.fetchpriority ??= 'auto';
		}
		delete resolvedOptions.priority;
	}

	const validatedOptions = service.validateOptions
		? await service.validateOptions(resolvedOptions, imageConfig)
		: resolvedOptions;

	// Get all the options for the different srcSets
	const srcSetTransforms = service.getSrcSet
		? await service.getSrcSet(validatedOptions, imageConfig)
		: [];

	let imageURL = await service.getURL(validatedOptions, imageConfig);

	const matchesOriginal = (transform: ImageTransform) =>
		transform.width === originalWidth &&
		transform.height === originalHeight &&
		transform.format === originalFormat;

	let srcSets: SrcSetValue[] = await Promise.all(
		srcSetTransforms.map(async (srcSet) => {
			return {
				transform: srcSet.transform,
				url: matchesOriginal(srcSet.transform)
					? imageURL
					: await service.getURL(srcSet.transform, imageConfig),
				descriptor: srcSet.descriptor,
				attributes: srcSet.attributes,
			};
		}),
	);

	if (
		isLocalService(service) &&
		globalThis.astroAsset.addStaticImage &&
		!(isRemoteImage(validatedOptions.src) && imageURL === validatedOptions.src)
	) {
		const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
		imageURL = globalThis.astroAsset.addStaticImage(
			validatedOptions,
			propsToHash,
			originalFilePath,
		);
		srcSets = srcSetTransforms.map((srcSet) => {
			return {
				transform: srcSet.transform,
				url: matchesOriginal(srcSet.transform)
					? imageURL
					: globalThis.astroAsset.addStaticImage!(srcSet.transform, propsToHash, originalFilePath),
				descriptor: srcSet.descriptor,
				attributes: srcSet.attributes,
			};
		});
	}

	return {
		rawOptions: resolvedOptions,
		options: validatedOptions,
		src: imageURL,
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
