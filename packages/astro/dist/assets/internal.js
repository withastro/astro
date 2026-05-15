import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { DEFAULT_HASH_PROPS } from './consts.js';
import {
	DEFAULT_RESOLUTIONS,
	getSizesAttribute,
	getWidths,
	LIMITED_RESOLUTIONS,
} from './layout.js';
import { isLocalService } from './services/service.js';
import { isImageMetadata } from './types.js';
import { isESMImportedImage, isRemoteImage, resolveSrc } from './utils/imageKind.js';
import { inferRemoteSize } from './utils/remoteProbe.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from './utils/url.js';
import { verifyOptions } from './services/service.js';
const cssFitValues = ['fill', 'contain', 'cover', 'scale-down'];
async function getConfiguredImageService() {
	if (!globalThis?.astroAsset?.imageService) {
		const { default: service } = await import(
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
async function getImage(options, imageConfig) {
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
	const resolvedOptions = {
		...options,
		src: await resolveSrc(options.src),
	};
	let originalWidth;
	let originalHeight;
	if (resolvedOptions.inferSize) {
		delete resolvedOptions.inferSize;
		if (isRemoteImage(resolvedOptions.src) && isRemotePath(resolvedOptions.src)) {
			if (!isRemoteAllowed(resolvedOptions.src, imageConfig)) {
				throw new AstroError({
					...AstroErrorData.RemoteImageNotAllowed,
					message: AstroErrorData.RemoteImageNotAllowed.message(resolvedOptions.src),
				});
			}
			const getRemoteSize = (url) =>
				service.getRemoteSize?.(url, imageConfig) ?? inferRemoteSize(url, imageConfig);
			const result = await getRemoteSize(resolvedOptions.src);
			resolvedOptions.width ??= result.width;
			resolvedOptions.height ??= result.height;
			originalWidth = result.width;
			originalHeight = result.height;
		}
	}
	const originalFilePath = isESMImportedImage(resolvedOptions.src)
		? resolvedOptions.src.fsPath
		: void 0;
	const clonedSrc = isESMImportedImage(resolvedOptions.src)
		? // @ts-expect-error - clone is a private, hidden prop
			(resolvedOptions.src.clone ?? resolvedOptions.src)
		: resolvedOptions.src;
	if (isESMImportedImage(clonedSrc)) {
		originalWidth = clonedSrc.width;
		originalHeight = clonedSrc.height;
	}
	if (originalWidth && originalHeight) {
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
		resolvedOptions.fetchpriority ??= void 0;
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
		delete resolvedOptions.densities;
		resolvedOptions['data-astro-image'] = layout;
		if (resolvedOptions.fit && cssFitValues.includes(resolvedOptions.fit)) {
			resolvedOptions['data-astro-image-fit'] = resolvedOptions.fit;
		}
		const currentPosition = resolvedOptions.position || 'center';
		resolvedOptions['data-astro-image-pos'] = currentPosition.replace(/\s+/g, '-');
		if (resolvedOptions.position) {
			if (typeof resolvedOptions.style === 'object' && resolvedOptions.style !== null) {
				if (!('objectPosition' in resolvedOptions.style)) {
					resolvedOptions.style = {
						...resolvedOptions.style,
						objectPosition: resolvedOptions.position,
					};
				}
			} else {
				const existingStyle =
					typeof resolvedOptions.style === 'string' ? resolvedOptions.style : '';
				if (!existingStyle.includes('object-position')) {
					const positionStyle = `object-position: ${resolvedOptions.position}`;
					resolvedOptions.style = existingStyle
						? existingStyle.replace(/;?\s*$/, '; ') + positionStyle
						: positionStyle;
				}
			}
		}
	}
	const validatedOptions = service.validateOptions
		? await service.validateOptions(resolvedOptions, imageConfig)
		: resolvedOptions;
	const srcSetTransforms = service.getSrcSet
		? await service.getSrcSet(validatedOptions, imageConfig)
		: [];
	const lazyImageURLFactory = (getValue) => {
		let cached = null;
		return () => (cached ??= getValue());
	};
	const initialImageURL = await service.getURL(validatedOptions, imageConfig);
	let lazyImageURL = lazyImageURLFactory(() => initialImageURL);
	const matchesValidatedTransform = (transform) =>
		transform.width === validatedOptions.width &&
		transform.height === validatedOptions.height &&
		transform.format === validatedOptions.format;
	let srcSets = await Promise.all(
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
			globalThis.astroAsset.addStaticImage(validatedOptions, propsToHash, originalFilePath),
		);
		srcSets = srcSetTransforms.map((srcSet) => {
			return {
				transform: srcSet.transform,
				url: matchesValidatedTransform(srcSet.transform)
					? lazyImageURL()
					: globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalFilePath),
				descriptor: srcSet.descriptor,
				attributes: srcSet.attributes,
			};
		});
	} else if (imageConfig.assetQueryParams) {
		const imageURLObj = createPlaceholderURL(initialImageURL);
		imageConfig.assetQueryParams.forEach((value, key) => {
			imageURLObj.searchParams.set(key, value);
		});
		lazyImageURL = lazyImageURLFactory(() => stringifyPlaceholderURL(imageURLObj));
		srcSets = srcSets.map((srcSet) => {
			const urlObj = createPlaceholderURL(srcSet.url);
			imageConfig.assetQueryParams.forEach((value, key) => {
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
			service.getHTMLAttributes !== void 0
				? await service.getHTMLAttributes(validatedOptions, imageConfig)
				: {},
	};
}
export { cssFitValues, getConfiguredImageService, getImage, verifyOptions };
