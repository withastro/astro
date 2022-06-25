/**
 * Checks if a string is a supported output image format.
 * 
 * @param value Value to be validated.
 * @returns {Boolean} true if the string is a supported output format, false otherwise.
 */
export function isOutputFormat(value: string): value is OutputFormat {
	return ['avif', 'jpeg', 'png', 'webp'].includes(value);
}

/**
 * Checks if a string is a valid aspect ratio, ex: "16:9" or "3:4".
 * 
 * @param value Value to be validated.
 * @returns {Boolean} true if the string is a valid aspect ratio, false otherwise.
 */
export function isAspectRatioString(value: string): value is `${number}:${number}` {
	return /^\d*:\d*$/.test(value);
}

export type OutputFormat =
	| 'avif'
	| 'jpeg'
	| 'png'
	| 'webp';

/**
 * Converts a set of image props to the filename to use when building for static.
 * 
 * This is only used for static production builds and ignored when an SSR adapter is used,
 * or in `astro dev` for static builds.
 */
export type FilenameFormatter = (props: ImageProps) => string;

export interface IntegrationOptions {
	/**
	 * Entry point for the @type {HostedImageService} or @type {LocalImageService} to be used.
	 */
	serviceEntryPoint?: string;
}

/**
 * Defines the original image and transforms that need to be applied to it.
 */
export interface ImageProps {
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

export type ImageAttributes = Partial<HTMLImageElement>;

export interface HostedImageService<T extends ImageProps = ImageProps> {
	/**
	 * Gets the HTML attributes needed for the server rendered `<img />` element.
	 */
	getImageAttributes(props: T): Promise<ImageAttributes>;
}

export interface SSRImageService<T extends ImageProps = ImageProps> extends HostedImageService<T> {
	/**
	 * Gets the HTML attributes needed for the server rendered `<img />` element.
	 */
	 getImageAttributes(props: T): Promise<Exclude<ImageAttributes, 'src'>>;
	/**
	 * Serializes image transformation properties to URLSearchParams, used to build
	 * the final `src` that points to the self-hosted SSR endpoint.
	 * 
	 * @param props @type {ImageProps} defining the requested image transformation.
	 */
	serializeImageProps(props: T): { searchParams: URLSearchParams };
	/**
	 * The reverse of `serializeImageProps(props)`, this parsed the @type {ImageProps} back out of a given URL.
	 * 
	 * @param searchParams @type {URLSearchParams}
	 * @returns @type {ImageProps} used to generate the URL, or undefined if the URL isn't valid.
	 */
	parseImageProps(searchParams: URLSearchParams): T | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 * 
	 * @param inputBuffer Binary buffer containing the original image.
	 * @param props @type {ImageProps} defining the requested transformations.
	 */
	transform(inputBuffer: Buffer, props: T): Promise<{ data: Buffer, format: OutputFormat }>;
}

export type ImageService<T extends ImageProps = ImageProps> = HostedImageService<T> | SSRImageService<T>;

export interface ImageMetadata {
	width: number;
	height: number;
	format: string;
}
