import type { AstroConfig } from '../../@types/astro.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { isRemotePath, joinPaths } from '../../core/path.js';
import { VALID_SUPPORTED_FORMATS } from '../consts.js';
import { isESMImportedImage, isRemoteAllowed } from '../internal.js';
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

type ImageConfig<T> = Omit<AstroConfig['image'], 'service'> & {
	service: { entrypoint: string; config: T };
};

interface SharedServiceProps<T extends Record<string, any> = Record<string, any>> {
	/**
	 * Return the URL to the endpoint or URL your images are generated from.
	 *
	 * For a local service, your service should expose an endpoint handling the image requests, or use Astro's at `/_image`.
	 *
	 * For external services, this should point to the URL your images are coming from, for instance, `/_vercel/image`
	 *
	 */
	getURL: (options: ImageTransform, imageConfig: ImageConfig<T>) => string | Promise<string>;
	/**
	 * Return any additional HTML attributes separate from `src` that your service requires to show the image properly.
	 *
	 * For example, you might want to return the `width` and `height` to avoid CLS, or a particular `class` or `style`.
	 * In most cases, you'll want to return directly what your user supplied you, minus the attributes that were used to generate the image.
	 */
	getHTMLAttributes?: (
		options: ImageTransform,
		imageConfig: ImageConfig<T>
	) => Record<string, any> | Promise<Record<string, any>>;
	/**
	 * Validate and return the options passed by the user.
	 *
	 * This method is useful to present errors to users who have entered invalid options.
	 * For instance, if they are missing a required property or have entered an invalid image format.
	 *
	 * This method should returns options, and can be used to set defaults (ex: a default output format to be used if the user didn't specify one.)
	 */
	validateOptions?: (
		options: ImageTransform,
		imageConfig: ImageConfig<T>
	) => ImageTransform | Promise<ImageTransform>;
}

export type ExternalImageService<T extends Record<string, any> = Record<string, any>> =
	SharedServiceProps<T>;

export type LocalImageTransform = {
	src: string;
	[key: string]: any;
};

export interface LocalImageService<T extends Record<string, any> = Record<string, any>>
	extends SharedServiceProps<T> {
	/**
	 * Parse the requested parameters passed in the URL from `getURL` back into an object to be used later by `transform`.
	 *
	 * In most cases, this will get query parameters using, for example, `params.get('width')` and return those.
	 */
	parseURL: (
		url: URL,
		imageConfig: ImageConfig<T>
	) => LocalImageTransform | undefined | Promise<LocalImageTransform> | Promise<undefined>;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 */
	transform: (
		inputBuffer: Buffer,
		transform: LocalImageTransform,
		imageConfig: ImageConfig<T>
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
				message: AstroErrorData.ExpectedImage.message(
					JSON.stringify(options.src),
					typeof options.src,
					JSON.stringify(options, (_, v) => (v === undefined ? null : v))
				),
			});
		}

		if (!isESMImportedImage(options.src)) {
			// User passed an `/@fs/` path or a filesystem path instead of the full image.
			if (
				options.src.startsWith('/@fs/') ||
				(!isRemotePath(options.src) && !options.src.startsWith('/'))
			) {
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
			if (!VALID_SUPPORTED_FORMATS.includes(options.src.format as any)) {
				throw new AstroError({
					...AstroErrorData.UnsupportedImageFormat,
					message: AstroErrorData.UnsupportedImageFormat.message(
						options.src.format,
						options.src.src,
						VALID_SUPPORTED_FORMATS
					),
				});
			}

			// We currently do not support processing SVGs, so whenever the input format is a SVG, force the output to also be one
			if (options.src.format === 'svg') {
				options.format = 'svg';
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
	getURL(options, imageConfig) {
		const searchParams = new URLSearchParams();

		if (isESMImportedImage(options.src)) {
			searchParams.append('href', options.src.src);
		} else if (isRemoteAllowed(options.src, imageConfig)) {
			searchParams.append('href', options.src);
		} else {
			// If it's not an imported image, nor is it allowed using the current domains or remote patterns, we'll just return the original URL
			return options.src;
		}

		const params: Record<string, keyof typeof options> = {
			w: 'width',
			h: 'height',
			q: 'quality',
			f: 'format',
		};

		Object.entries(params).forEach(([param, key]) => {
			options[key] && searchParams.append(param, options[key].toString());
		});

		const imageEndpoint = joinPaths(import.meta.env.BASE_URL, '/_image');
		return `${imageEndpoint}?${searchParams}`;
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
