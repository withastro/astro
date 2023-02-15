import { isESMImportedImage, isRemoteImage } from '../internal.js';
import { ImageTransform, OutputFormat } from '../types.js';

declare global {
	// eslint-disable-next-line no-var
	var astroImageService: ImageService;
}

export type ImageService = LocalImageService | ExternalImageService;

export function isLocalService(service: ImageService): service is LocalImageService {
	return 'transform' in service;
}

interface SharedServiceProps {
	getURL: (options: ImageTransform) => string;
	getAdditionalAttributes?: (options: ImageTransform) => Record<string, any>;
}

export type ExternalImageService = SharedServiceProps;
export interface LocalImageService extends SharedServiceProps {
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
 * Basic local service to inherit from
 */
export const baseService: Omit<LocalImageService, 'transform'> = {
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

		let transform: Partial<ImageTransform> = { src: params.get('href')! };

		if (params.has('w')) {
			transform.width = parseInt(params.get('w')!);
		}

		if (params.has('h')) {
			transform.height = parseInt(params.get('h')!);
		}

		return transform;
	},
};
