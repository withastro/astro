/// <reference types="astro/astro-jsx" />
export type InputFormat =
	| 'heic'
	| 'heif'
	| 'avif'
	| 'jpeg'
	| 'jpg'
	| 'png'
	| 'tiff'
	| 'webp'
	| 'gif';

export type OutputFormat = 'avif' | 'jpeg' | 'png' | 'webp';

/**
 * Defines the original image and transforms that need to be applied to it.
 */
export interface TransformOptions {
	/**
	 * Source for the original image file.
	 *
	 * For images in your project's repository, use the `src` relative to the `public` directory.
	 * For remote images, provide the full URL.
	 */
	src: string;
	/**
	 * The output format to be used in the optimized image.
	 *
	 * @default undefined The original image format will be used.
	 */
	format?: OutputFormat;
	/**
	 * The compression quality used during optimization.
	 *
	 * @default undefined Allows the image service to determine defaults.
	 */
	quality?: number;
	/**
	 * The desired width of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the height.
	 */
	width?: number;
	/**
	 * The desired height of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the width.
	 */
	height?: number;
	/**
	 * The desired aspect ratio of the output image. Combine with either `width` or `height`
	 * to automatically calculate and crop the other dimension.
	 *
	 * @example 1.777 - numbers can be used for computed ratios, useful for doing `{width/height}`
	 * @example "16:9" - strings can be used in the format of `{ratioWidth}:{ratioHeight}`.
	 */
	aspectRatio?: number | `${number}:${number}`;
}

export interface HostedImageService<T extends TransformOptions = TransformOptions> {
	/**
	 * Gets the HTML attributes needed for the server rendered `<img />` element.
	 */
	getImageAttributes(transform: T): Promise<astroHTML.JSX.ImgHTMLAttributes>;
}

export interface SSRImageService<T extends TransformOptions = TransformOptions>
	extends HostedImageService<T> {
	/**
	 * Gets the HTML attributes needed for the server rendered `<img />` element.
	 */
	getImageAttributes(transform: T): Promise<Exclude<astroHTML.JSX.ImgHTMLAttributes, 'src'>>;
	/**
	 * Serializes image transformation properties to URLSearchParams, used to build
	 * the final `src` that points to the self-hosted SSR endpoint.
	 *
	 * @param transform @type {TransformOptions} defining the requested image transformation.
	 */
	serializeTransform(transform: T): { searchParams: URLSearchParams };
	/**
	 * The reverse of `serializeTransform(transform)`, this parsed the @type {TransformOptions} back out of a given URL.
	 *
	 * @param searchParams @type {URLSearchParams}
	 * @returns @type {TransformOptions} used to generate the URL, or undefined if the URL isn't valid.
	 */
	parseTransform(searchParams: URLSearchParams): T | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 *
	 * @param inputBuffer Binary buffer containing the original image.
	 * @param transform @type {TransformOptions} defining the requested transformations.
	 */
	transform(inputBuffer: Buffer, transform: T): Promise<{ data: Buffer; format: OutputFormat }>;
}

export type ImageService<T extends TransformOptions = TransformOptions> =
	| HostedImageService<T>
	| SSRImageService<T>;

export function isHostedService(service: ImageService): service is ImageService {
	return 'getImageSrc' in service;
}

export function isSSRService(service: ImageService): service is SSRImageService {
	return 'transform' in service;
}
