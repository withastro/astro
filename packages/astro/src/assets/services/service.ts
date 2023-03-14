import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { isRemotePath } from '../../core/path.js';
import { VALID_INPUT_FORMATS } from '../consts.js';
import { isESMImportedImage } from '../internal.js';
import type { ImageTransform, OutputFormat } from '../types.js';

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
	getURL: (options: ImageTransform) => string;
	/**
	 * Return any additional HTML attributes separate from `src` that your service requires to show the image properly.
	 *
	 * For example, you might want to return the `width` and `height` to avoid CLS, or a particular `class` or `style`.
	 * In most cases, you'll want to return directly what your user supplied you, minus the attributes that were used to generate the image.
	 */
	getHTMLAttributes?: (options: ImageTransform) => Record<string, any>;
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
	parseURL: (url: URL) => LocalImageTransform | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 */
	transform: (
		inputBuffer: Buffer,
		transform: LocalImageTransform
	) => Promise<{ data: Buffer; format: OutputFormat }>;
}

export type BaseServiceTransform = {
	src: string;
	width?: number;
	height?: number;
	format?: string | null;
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
					message: AstroErrorData.MissingImageDimension.message(missingDimension, options.src),
				});
			}
		}

		// Both our currently available local services don't handle remote images, so for them we can just return as is
		if (!isESMImportedImage(options.src) && isRemotePath(options.src)) {
			return options.src;
		}

		if (
			isESMImportedImage(options.src) &&
			!VALID_INPUT_FORMATS.includes(options.src.format as any)
		) {
			throw new AstroError({
				...AstroErrorData.UnsupportedImageFormat,
				message: AstroErrorData.UnsupportedImageFormat.message(
					options.src.format,
					options.src.src,
					VALID_INPUT_FORMATS
				),
			});
		}

		const searchParams = new URLSearchParams();
		searchParams.append('href', isESMImportedImage(options.src) ? options.src.src : options.src);

		options.width && searchParams.append('w', options.width.toString());
		options.height && searchParams.append('h', options.height.toString());
		options.quality && searchParams.append('q', options.quality.toString());
		options.format && searchParams.append('f', options.format);

		return '/_image?' + searchParams;
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
			format: params.get('f') as OutputFormat | null,
			quality: params.get('q'),
		};

		return transform;
	},
};
