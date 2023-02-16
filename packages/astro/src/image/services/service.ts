import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { isESMImportedImage, isRemoteImage } from '../internal.js';
import { ImageQuality, ImageTransform, OutputFormat } from '../types.js';

declare global {
	// eslint-disable-next-line no-var
	var astroImageService: ImageService;
}

export type ImageService = LocalImageService | ExternalImageService;

export function isLocalService(service: ImageService): service is LocalImageService {
	return 'transform' in service;
}

interface SharedServiceProps {
	/**
	 * Return the URL to the endpoint or URL your image are generated from.
	 *
	 * For a local service, your service should expose an endpoint handling the image requests, or use Astro's at `/_image`.
	 *
	 * For external services, this should point to the URL where your images are coming from, for instance, `/_vercel/image`
	 *
	 */
	getURL: (options: ImageTransform) => string;
	/**
	 * Return any additional HTML attributes separate from `src` your service require to show the image properly.
	 *
	 * For example, you might want to return the result `width` and `height` to avoid CLS, or a particular `class` or `style`.
	 * In most cases, you'll want to return directly what your user supplied you, minus the attributes that were used to generate the image.
	 */
	getHTMLAttributes?: (options: ImageTransform) => Record<string, any>;
	/**
	 * Validate the parameters the user supplied to your service and return them.
	 *
	 * This is helpful if you want to, for instance, ensure that your user supplied both `width` and `height`.
	 */
	validateTransform?: (options: ImageTransform) => ImageTransform;
}

export type ExternalImageService = SharedServiceProps;
export interface LocalImageService extends SharedServiceProps {
	/**
	 * Parse the requested parameters passed along the URL from `getURL` back into an object to be used later by `transform`
	 *
	 * In most cases, this will get query parameters using, for example, `params.get('width')` and return that.
	 */
	parseParams: (
		params: URLSearchParams
	) => Partial<ImageTransform> | Promise<Partial<ImageTransform>> | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 *
	 * @param inputBuffer Binary buffer containing the original image.
	 * @param transform @type {TransformOptions} defining the requested transformations.
	 */
	transform: (
		inputBuffer: Buffer,
		transform: Partial<ImageTransform>
	) => Promise<{ data: Buffer; format: OutputFormat }>;
}

/**
 * Basic local service to take things from
 */
export const baseService: Omit<LocalImageService, 'transform'> = {
	validateTransform(options) {
		if (options.alt === undefined || options.alt === null) {
			throw new AstroError(AstroErrorData.ImageMissingAlt);
		}

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
	},
	getHTMLAttributes(options) {
		let targetWidth = options.width;
		let targetHeight = options.height;
		if (isESMImportedImage(options.src)) {
			const aspectRatio = options.src.width / options.src.height;

			// If we have a desired height and no width, calculate the target width automatically
			if (targetHeight && !targetWidth) {
				targetWidth = Math.round(targetHeight * aspectRatio);
			} else if (targetWidth && !targetHeight) {
				targetHeight = Math.round(targetWidth / aspectRatio);
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
		// Both our currently available local services don't handle remote images, so for them we can just return as is
		if (!isESMImportedImage(options.src) && isRemoteImage(options.src)) {
			return options.src;
		}

		const searchParams = new URLSearchParams();
		searchParams.append('href', isESMImportedImage(options.src) ? options.src.src : options.src);

		options.width && searchParams.append('w', options.width.toString());
		options.height && searchParams.append('h', options.height.toString());
		options.quality && searchParams.append('q', options.quality.toString());
		options.format && searchParams.append('f', options.format);

		return '/_image?' + searchParams;
	},
	parseParams(params) {
		if (!params.has('href')) {
			return undefined;
		}

		let transform: ImageTransform = { src: params.get('href')! };

		if (params.has('w')) {
			transform.width = parseInt(params.get('w')!);
		}

		if (params.has('h')) {
			transform.height = parseInt(params.get('h')!);
		}

		if (params.has('f')) {
			transform.format = params.get('f') as OutputFormat;
		}

		if (params.has('q')) {
			transform.quality = params.get('q')! as ImageQuality;
		}

		return transform;
	},
};
