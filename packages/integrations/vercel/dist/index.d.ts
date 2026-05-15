import type { AstroIntegration, MiddlewareMode } from 'astro';
import { type DevImageService, type VercelImageConfig } from './image/shared.js';
import { type VercelWebAnalyticsConfig } from './lib/web-analytics.js';
/**
 * The edge function calls the node server at /_render,
 * with the original path as the value of this header.
 */
export declare const ASTRO_PATH_HEADER = 'x-astro-path';
export declare const ASTRO_PATH_PARAM = 'x_astro_path';
/**
 * The edge function calls the node server at /_render,
 * with the locals serialized into this header.
 */
export declare const ASTRO_LOCALS_HEADER = 'x-astro-locals';
export declare const ASTRO_MIDDLEWARE_SECRET_HEADER = 'x-astro-middleware-secret';
export declare const VERCEL_EDGE_MIDDLEWARE_FILE = 'vercel-edge-middleware';
export declare const NODE_PATH = '_render';
export interface VercelServerlessConfig {
	/** Configuration for [Vercel Web Analytics](https://vercel.com/docs/concepts/analytics). */
	webAnalytics?: VercelWebAnalyticsConfig;
	/** Force files to be bundled with your function. This is helpful when you notice missing files. */
	includeFiles?: string[];
	/** Exclude any files from the bundling process that would otherwise be included. */
	excludeFiles?: string[];
	/** When enabled, an Image Service powered by the Vercel Image Optimization API will be automatically configured and used in production. In development, the image service specified by devImageService will be used instead. */
	imageService?: boolean;
	/** Configuration options for [Vercel’s Image Optimization API](https://vercel.com/docs/concepts/image-optimization). See [Vercel’s image configuration documentation](https://vercel.com/docs/build-output-api/v3/configuration#images) for a complete list of supported parameters. */
	imagesConfig?: VercelImageConfig;
	/** Allows you to configure which image service to use in development when imageService is enabled. */
	devImageService?: DevImageService;
	/**
	 * Controls when and how middleware executes.
	 * - 'classic' (default): Middleware runs for prerendered pages at build time, and for SSR pages at request time.
	 * - 'edge': Middleware is deployed as a separate edge function.
	 */
	middlewareMode?: MiddlewareMode;
	/**
	 * @deprecated Use `middlewareMode: 'edge'` instead.
	 */
	edgeMiddleware?: boolean;
	/** The maximum duration (in seconds) that Serverless Functions can run before timing out. See the [Vercel documentation](https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration) for the default and maximum limit for your account plan. */
	maxDuration?: number;
	/** Whether to cache on-demand rendered pages in the same way as static files. */
	isr?: boolean | VercelISRConfig;
	/**
	 * It enables Vercel skew protection: https://vercel.com/docs/deployments/skew-protection
	 */
	skewProtection?: boolean;
	/**
	 * If enabled, the adapter will save [static headers in the framework API file](https://docs.netlify.com/frameworks-api/#headers).
	 *
	 * Here the list of the headers that are added:
	 * - The CSP header of the static pages is added when CSP support is enabled.
	 */
	staticHeaders?: boolean;
}
interface VercelISRConfig {
	/**
	 * A secret random string that you create.
	 * Its presence in the `__prerender_bypass` cookie will result in fresh responses being served, bypassing the cache. See Vercel’s documentation on [Draft Mode](https://vercel.com/docs/build-output-api/v3/features#draft-mode) for more information.
	 * Its presence in the `x-prerender-revalidate` header will result in a fresh response which will then be cached for all future requests to be used. See Vercel’s documentation on [On-Demand Incremental Static Regeneration (ISR)](https://vercel.com/docs/build-output-api/v3/features#on-demand-incremental-static-regeneration-isr) for more information.
	 *
	 * @default `undefined`
	 */
	bypassToken?: string;
	/**
	 * Expiration time (in seconds) before the pages will be re-generated.
	 *
	 * Setting to `false` means that the page will stay cached as long as the current deployment is in production.
	 *
	 * @default `false`
	 */
	expiration?: number | false;
	/**
	 * Paths that will always be served by a serverless function instead of an ISR function.
	 *
	 * @default `[]`
	 */
	exclude?: (string | RegExp)[];
}
export default function vercelAdapter({
	webAnalytics,
	includeFiles: _includeFiles,
	excludeFiles: _excludeFiles,
	imageService,
	imagesConfig,
	devImageService,
	middlewareMode,
	edgeMiddleware,
	maxDuration,
	isr,
	skewProtection,
	staticHeaders,
}?: VercelServerlessConfig): AstroIntegration;
export {};
