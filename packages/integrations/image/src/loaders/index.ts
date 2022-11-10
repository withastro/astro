import { isAspectRatioString, isOutputFormat } from './transforms.js';
import { ColorDefinition, OutputFormat, ImageTransform } from './transforms.js';
import { isRemoteImage } from '../utils/paths.js';

export * from './transforms.js';

export interface HostedImageService {
	/**
	 * Gets the HTML attributes needed for the server rendered `<img />` element.
	 */
	getImageAttributes(transform: ImageTransform): Promise<astroHTML.JSX.ImgHTMLAttributes>;
}

export interface SSRImageService extends HostedImageService {
	/**
	 * Gets the HTML attributes needed for the server rendered `<img />` element.
	 */
	getImageAttributes(transform: ImageTransform): Promise<Exclude<astroHTML.JSX.ImgHTMLAttributes, 'src'>>;
	/**
	 * The reverse of `serializeTransform(transform)`, this parsed the @type {TransformOptions} back out of a given URL.
	 *
	 * @param searchParams @type {URLSearchParams}
	 * @returns @type {TransformOptions} used to generate the URL, or undefined if the URL isn't valid.
	 */
	parseTransform(searchParams: URLSearchParams): ImageTransform | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 *
	 * @param inputBuffer Binary buffer containing the original image.
	 * @param transform @type {ImageTransform} defining the requested transformations.
	 */
	transform(inputBuffer: Buffer, transform: ImageTransform): Promise<{ data: Buffer; format: OutputFormat }>;
}

export type ImageService = HostedImageService	| SSRImageService;

export function isHostedService(service: ImageService): service is ImageService {
	return 'getImageSrc' in service;
}

export function isSSRService(service: ImageService): service is SSRImageService {
	return 'transform' in service;
}

export abstract class BaseSSRService implements SSRImageService {
	async getImageAttributes(transform: ImageTransform) {
		// strip off the known attributes
		const { width, height, src, format, quality, aspectRatio, ...rest } = transform;

		let resolvedSrc = src;

		const searchParams = this.transformToSearchParams(transform);

		resolvedSrc = isRemoteImage(src) && src.startsWith('//') ? `https:${src}` : src;

		if (/^[\/\\]?@astroimage/.test(resolvedSrc)) {
			resolvedSrc = `${resolvedSrc}?${searchParams.toString()}`;
		} else {
			searchParams.set('href', resolvedSrc);
			resolvedSrc = `/_image?${searchParams.toString()}`;
		}

		return {
			...rest,
			src: resolvedSrc,
			width: width,
			height: height,
		};
	}

	parseTransform(searchParams: URLSearchParams) {
		if (!searchParams.has('href')) {
			return undefined;
		}

		let transform = { src: searchParams.get('href')! } as ImageTransform;

		if (searchParams.has('q')) {
			transform.quality = parseInt(searchParams.get('q')!);
		}

		if (searchParams.has('f')) {
			const format = searchParams.get('f')!;
			if (isOutputFormat(format)) {
				transform.format = format;
			}
		}

		if (searchParams.has('w')) {
			transform.width = parseInt(searchParams.get('w')!);
		}

		if (searchParams.has('h')) {
			transform.height = parseInt(searchParams.get('h')!);
		}

		if (searchParams.has('ar')) {
			const ratio = searchParams.get('ar')!;

			if (isAspectRatioString(ratio)) {
				transform.aspectRatio = ratio;
			} else {
				transform.aspectRatio = parseFloat(ratio);
			}
		}

		if (searchParams.has('fit')) {
			transform.fit = searchParams.get('fit') as typeof transform.fit;
		}

		if (searchParams.has('p')) {
			transform.position = decodeURI(searchParams.get('p')!) as typeof transform.position;
		}

		if (searchParams.has('bg')) {
			transform.background = searchParams.get('bg') as ColorDefinition;
		}

		return transform;
	}

	transformToSearchParams(transform: ImageTransform) {
		const searchParams = new URLSearchParams();

		if (transform.quality) {
			searchParams.append('q', transform.quality.toString());
		}

		if (transform.format) {
			searchParams.append('f', transform.format);
		}

		if (transform.width) {
			searchParams.append('w', transform.width.toString());
		}

		if (transform.height) {
			searchParams.append('h', transform.height.toString());
		}

		if (transform.aspectRatio) {
			searchParams.append('ar', transform.aspectRatio.toString());
		}

		if (transform.fit) {
			searchParams.append('fit', transform.fit);
		}

		if (transform.background) {
			searchParams.append('bg', transform.background);
		}

		if (transform.position) {
			searchParams.append('p', encodeURI(transform.position));
		}

		searchParams.append('href', transform.src);

		return searchParams
	}

	abstract transform(
		inputBuffer: Buffer,
		transform: ImageTransform
	): Promise<{ data: Buffer; format: OutputFormat }>;
}
