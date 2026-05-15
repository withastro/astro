import type { AstroConfig, ImageTransform } from 'astro';
export declare function getDefaultImageConfig(
	astroImageConfig: AstroConfig['image'],
): VercelImageConfig;
export type DevImageService = 'sharp' | (string & {});
type ImageFormat = 'image/avif' | 'image/webp';
export type RemotePattern = {
	protocol?: 'http' | 'https';
	hostname: string;
	port?: string;
	pathname?: string;
};
export type VercelImageConfig = {
	/**
	 * Supported image widths.
	 */
	sizes: number[];
	/**
	 * Allowed external domains that can use Image Optimization. Set to `[]` to only allow the deployment domain to use Image Optimization.
	 */
	domains?: string[];
	/**
	 * Allowed external patterns that can use Image Optimization. Similar to `domains` but provides more control with RegExp.
	 */
	remotePatterns?: RemotePattern[];
	/**
	 * Cache duration (in seconds) for the optimized images.
	 */
	minimumCacheTTL?: number;
	/**
	 * Supported output image formats
	 */
	formats?: ImageFormat[];
	/**
	 * Allow SVG input image URLs. This is disabled by default for security purposes.
	 */
	dangerouslyAllowSVG?: boolean;
	/**
	 * Change the [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) of the optimized images.
	 */
	contentSecurityPolicy?: string;
};
export declare function getAstroImageConfig(
	images: boolean | undefined,
	imagesConfig: VercelImageConfig | undefined,
	command: string,
	devImageService: DevImageService,
	astroImageConfig: AstroConfig['image'],
):
	| {
			image: {
				service: {
					entrypoint: string;
					config: VercelImageConfig;
				};
				breakpoints: number[];
			};
	  }
	| {
			image?: undefined;
	  };
export declare function sharedValidateOptions(
	options: ImageTransform,
	serviceConfig: Record<string, any>,
	mode: 'development' | 'production',
): ImageTransform;
export {};
