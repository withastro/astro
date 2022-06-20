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
	 * The output directory used for optimized images in static production builds,
	 * relative to your project's dist directory.
	 * 
	 * @example "/images/" will build images to "/dist/images/"
	 * @default /images/
	 */
	outputDir?: string;
	/**
	 * Returns a unique filename used for a given set of @type {ImageProps}.
	 */
	filenameFormat?: FilenameFormatter;
	/**
	 * The route used when building optimized images locally.
	 * 
	 * @example "/_images" will inject a route for optimized images similar to "/_images?href=/blog/hero.jpg".
	 * @default /_images
	 */
	routePattern?: string;
	/**
	 * Used for adding cache control headers to images in with the SSR image endpoint.
	 * This is ignored in `astro dev` and static production builds.
	 */
	ttl?: number;
	/**
	 * Entry point for the @type {HostedImageService} or @type {LocalImageService} to be used.
	 */
	loaderEntryPoint?: string;
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
	/** The output format to be used in the optimized image */
	format: OutputFormat;
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

export type ImageAttributes = Pick<HTMLImageElement, 'src'|'width'|'height'>;

export interface HostedImageService {
	/**
	 * Gets the `src`, `width`, and `height` attributes needed to properly render
	 * an `<img />` element.
	 */
	getImage(props: ImageProps): Promise<ImageAttributes>;
}

export interface SSRImageService {
	/**
	 * Gets the URL search parameters needed to request the transformed image from the SSR endpoint.
	 */
	getImage(props: ImageProps): Promise<{ searchParams: URLSearchParams }>;
	/**
	 * The reverse of `getImage(props)`, this parsed the @type {ImageProps} back out of a given URL.
	 * 
	 * @param src Request URL
	 * @returns @type {ImageProps} used to generate the URL, or undefined if the URL isn't valid.
	 */
	parseImageSrc(src: ImageAttributes['src']): ImageProps | undefined;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 * 
	 * @param inputBuffer Binary buffer containing the original image.
	 * @param props @type {ImageProps} defining the requested transformations.
	 */
	toBuffer(inputBuffer: Buffer, props: ImageProps): Promise<{ data: Buffer, format: OutputFormat }>;
}
