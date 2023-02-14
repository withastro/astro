import { isESMImportedImage } from '../internal.js';
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
	parseParams: (params: URLSearchParams) => Partial<ImageTransform> | undefined;
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

export const baseService = {
	getURL(options: ImageTransform) {
		const searchParams = new URLSearchParams();
		searchParams.append('href', isESMImportedImage(options.src) ? options.src.src : options.src);

		options.width && searchParams.append('w', options.width.toString());
		options.height && searchParams.append('h', options.height.toString());
		options.quality && searchParams.append('q', options.quality.toString());
		options.format && searchParams.append('f', options.format);

		return '/_image?' + searchParams;
	},
};
