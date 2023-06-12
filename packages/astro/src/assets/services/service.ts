import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { joinPaths } from '../../core/path.js';
import { VALID_OPTIMIZABLE_FORMATS } from '../consts.js';
import { isESMImportedImage } from '../internal.js';
import type { ImageOutputFormat, ImageTransform } from '../types.js';

export type ImageService = LocalImageService | ExternalImageService;

export function isLocalService(service: ImageService | undefined): service is LocalImageService {
	if (!service) {
		return false;
	}

	return 'transform' in service;
}

export function parseQuality(quality: string): string | number {
	let result = parseInt(quality);
	if (Number.isNaN(result)) {
		return quality;
	}

	return result;
}

interface SharedServiceProps {
	/**
	 * Return the URL to the endpoint or URL your images are generated from.
	 *
	 * For a local service, your service should expose an endpoint handling the image requests, or use Astro's at `/_image`.
	 *
	 * For external services, this should point to the URL your images are coming from, for instance, `/_vercel/image`
	 *
	 */
	getURL: (options: ImageTransform, serviceConfig: Record<string, any>) => string;
	/**
	 * Return any additional HTML attributes separate from `src` that your service requires to show the image properly.
	 *
	 * For example, you might want to return the `width` and `height` to avoid CLS, or a particular `class` or `style`.
	 * In most cases, you'll want to return directly what your user supplied you, minus the attributes that were used to generate the image.
	 */
	getHTMLAttributes?: (
		options: ImageTransform,
		serviceConfig: Record<string, any>
	) => Record<string, any>;
	/**
	 * Validate and return the options passed by the user.
	 *
	 * This method is useful to present errors to users who have entered invalid options.
	 * For instance, if they are missing a required property or have entered an invalid image format.
	 *
	 * This method should returns options, and can be used to set defaults (ex: a default output format to be used if the user didn't specify one.)
	 */
	validateOptions?: (options: ImageTransform, serviceConfig: Record<string, any>) => ImageTransform;
}

export type ExternalImageService = SharedServiceProps;

type LocalImageTransform = {
	src: string;
	[key: string]: any;
};

export interface LocalImageService extends SharedServiceProps {
	/**
	 * Parse the requested parameters passed in the URL from `getURL` back into an object to be used later by `transform`
	 *
	 * In most cases, this will get query parameters using, for example, `params.get('width')` and return those.
	 */
	parseURL: (url: URL, serviceConfig: Record<string, any>) => LocalImageTransform | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 */
	transform: (
		inputBuffer: Buffer,
		transform: LocalImageTransform,
		serviceConfig: Record<string, any>
	) => Promise<{ data: Buffer; format: ImageOutputFormat }>;
}

export type BaseServiceTransform = {
	src: string;
	width?: number;
	height?: number;
	format: string;
	quality?: string | null;
};

/**
 * Basic local service using the included `_image` endpoint.
 * This service intentionally does not implement `transform`.
 *
 * Example usage:
 * ```ts
 * const service = {
 *  getURL: baseService.getURL,
 *  parseURL: baseService.parseURL,
 *  getHTMLAttributes: baseService.getHTMLAttributes,
 *  async transform(inputBuffer, transformOptions) {...}
 * }
 * ```
 *
 * This service adhere to the included services limitations:
 * - Remote images are passed as is.
 * - Only a limited amount of formats are supported.
 * - For remote images, `width` and `height` are always required.
 *
 */
export const baseService: Omit<LocalImageService, 'transform'> = {
	validateOptions(options) {
		// `src` is missing or is `undefined`.
		if (!options.src || (typeof options.src !== 'string' && typeof options.src !== 'object')) {
			throw new AstroError({
				...AstroErrorData.ExpectedImage,
				message: AstroErrorData.ExpectedImage.message(JSON.stringify(options.src)),
			});
		}

		if (!isESMImportedImage(options.src)) {
			// User passed an `/@fs/` path instead of the full image.
			if (options.src.startsWith('/@fs/')) {
				throw new AstroError({
					...AstroErrorData.LocalImageUsedWrongly,
					message: AstroErrorData.LocalImageUsedWrongly.message(options.src),
				});
			}

			// For remote images, width and height are explicitly required as we can't infer them from the file
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
					message: AstroErrorData.MissingImageDimension.message(missingDimension, options.src),
				});
			}
		} else {
			if (!VALID_OPTIMIZABLE_FORMATS.includes(options.src.format as any)) {
				throw new AstroError({
					...AstroErrorData.UnsupportedImageFormat,
					message: AstroErrorData.UnsupportedImageFormat.message(
						options.src.format,
						options.src.src,
						VALID_OPTIMIZABLE_FORMATS
					),
				});
			}
		}

		// If the user didn't specify a format, we'll default to `webp`. It offers the best ratio of compatibility / quality
		// In the future, hopefully we can replace this with `avif`, alas, Edge. See https://caniuse.com/avif
		if (!options.format) {
			options.format = 'webp';
		}

		return options;
	},
	getHTMLAttributes(options) {
		let targetWidth = options.width;
		let targetHeight = options.height;
		if (isESMImportedImage(options.src)) {
			const aspectRatio = options.src.width / options.src.height;
			if (targetHeight && !targetWidth) {
				// If we have a height but no width, use height to calculate the width
				targetWidth = Math.round(targetHeight * aspectRatio);
			} else if (targetWidth && !targetHeight) {
				// If we have a width but no height, use width to calculate the height
				targetHeight = Math.round(targetWidth / aspectRatio);
			} else if (!targetWidth && !targetHeight) {
				// If we have neither width or height, use the original image's dimensions
				targetWidth = options.src.width;
				targetHeight = options.src.height;
			}
		}

		const { src, width, height, format, quality, ...attributes } = options;

		return {
			...attributes,
			width: targetWidth,
			height: targetHeight,
			loading: attributes.loading ?? 'lazy',
			decoding: attributes.decoding ?? 'async',
		};
	},
	getURL(options: ImageTransform) {
		// Both our currently available local services don't handle remote images, so we return the path as is.
		if (!isESMImportedImage(options.src)) {
			return options.src;
		}

		const searchParams = new URLSearchParams();
		searchParams.append('href', options.src.src);

		options.width && searchParams.append('w', options.width.toString());
		options.height && searchParams.append('h', options.height.toString());
		options.quality && searchParams.append('q', options.quality.toString());
		options.format && searchParams.append('f', options.format);

		return joinPaths(import.meta.env.BASE_URL, '/_image?') + searchParams;
	},
	parseURL(url) {
		const params = url.searchParams;

		if (!params.has('href')) {
			return undefined;
		}

		const transform: BaseServiceTransform = {
			src: params.get('href')!,
			width: params.has('w') ? parseInt(params.get('w')!) : undefined,
			height: params.has('h') ? parseInt(params.get('h')!) : undefined,
			format: params.get('f') as ImageOutputFormat,
			quality: params.get('q'),
		};

		return transform;
	},
};
