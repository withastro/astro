import type { AstroConfig } from '../../types/public/config.js';
import type {
	ImageFit,
	ImageMetadata,
	ImageOutputFormat,
	ImageTransform,
	UnresolvedSrcSetValue,
} from '../types.js';
export type ImageService = LocalImageService | ExternalImageService;
export declare function isLocalService(
	service: ImageService | undefined,
): service is LocalImageService;
export declare function parseQuality(quality: string): string | number;
type ImageConfig<T> = Omit<AstroConfig['image'], 'service'> & {
	service: {
		entrypoint: string;
		config: T;
	};
	assetQueryParams?: URLSearchParams;
};
interface SharedServiceProps<T extends Record<string, any> = Record<string, any>> {
	/**
	 * Return the URL to the endpoint or URL your images are generated from.
	 *
	 * For a local service, your service should expose an endpoint handling the image requests, or use Astro's which by default, is located at `/_image`.
	 *
	 * For external services, this should point to the URL your images are coming from, for instance, `/_vercel/image`
	 *
	 */
	getURL: (options: ImageTransform, imageConfig: ImageConfig<T>) => string | Promise<string>;
	/**
	 * Generate additional `srcset` values for the image.
	 *
	 * While in most cases this is exclusively used for `srcset`, it can also be used in a more generic way to generate
	 * multiple variants of the same image. For instance, you can use this to generate multiple aspect ratios or multiple formats.
	 */
	getSrcSet?: (
		options: ImageTransform,
		imageConfig: ImageConfig<T>,
	) => UnresolvedSrcSetValue[] | Promise<UnresolvedSrcSetValue[]>;
	/**
	 * Return any additional HTML attributes separate from `src` that your service requires to show the image properly.
	 *
	 * For example, you might want to return the `width` and `height` to avoid CLS, or a particular `class` or `style`.
	 * In most cases, you'll want to return directly what your user supplied you, minus the attributes that were used to generate the image.
	 */
	getHTMLAttributes?: (
		options: ImageTransform,
		imageConfig: ImageConfig<T>,
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
		imageConfig: ImageConfig<T>,
	) => ImageTransform | Promise<ImageTransform>;
	/**
	 * Return the dimensions of a remote image.
	 *
	 * This is used to infer the width and height of an image from its URL,
	 * allowing the service to provide necessary metadata when it's not available locally.
	 */
	getRemoteSize?: (
		url: string,
		imageConfig: ImageConfig<T>,
	) => Omit<ImageMetadata, 'src' | 'fsPath'> | Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>;
}
export type ExternalImageService<T extends Record<string, any> = Record<string, any>> =
	SharedServiceProps<T>;
type LocalImageTransform = {
	src: string;
	[key: string]: any;
};
export interface LocalImageService<
	T extends Record<string, any> = Record<string, any>,
> extends SharedServiceProps<T> {
	/**
	 * Parse the requested parameters passed in the URL from `getURL` back into an object to be used later by `transform`.
	 *
	 * In most cases, this will get query parameters using, for example, `params.get('width')` and return those.
	 */
	parseURL: (
		url: URL,
		imageConfig: ImageConfig<T>,
	) => LocalImageTransform | undefined | Promise<LocalImageTransform> | Promise<undefined>;
	/**
	 * Performs the image transformations on the input image and returns both the binary data and
	 * final image format of the optimized image.
	 */
	transform: (
		inputBuffer: Uint8Array,
		transform: LocalImageTransform,
		imageConfig: ImageConfig<T>,
	) => Promise<{
		data: Uint8Array;
		format: ImageOutputFormat;
	}>;
	/**
	 * A list of properties that should be used to generate the hash for the image.
	 *
	 * Generally, this should be all the properties that can change the result of the image. By default, this is `src`, `width`, `height`, `format`, `quality`, `fit`, `position`, and `background`.
	 */
	propertiesToHash?: string[];
}
export type BaseServiceTransform = {
	src: string;
	width?: number;
	height?: number;
	format: string;
	quality?: string | null;
	fit?: ImageFit;
	position?: string;
	background?: string;
};
export declare function verifyOptions(options: ImageTransform): void;
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
 * - Only a limited amount of formats are supported.
 * - For remote images, `width` and `height` are always required.
 *
 */
export declare const baseService: Omit<LocalImageService, 'transform'>;
export {};
