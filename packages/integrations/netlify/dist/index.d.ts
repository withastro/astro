import type { Context } from '@netlify/functions';
import type { AstroConfig, AstroIntegration, AstroIntegrationLogger, MiddlewareMode } from 'astro';
export interface NetlifyLocals {
	netlify: {
		context: Context;
	};
}
type RemotePattern = AstroConfig['image']['remotePatterns'][number];
/**
 * Convert a remote pattern object to a regex string
 */
export declare function remotePatternToRegex(
	pattern: RemotePattern,
	logger: AstroIntegrationLogger,
): string | undefined;
export interface NetlifyIntegrationConfig {
	/**
	 * Force files to be bundled with your SSR function.
	 * This is useful for including any type of file that is not directly detected by the bundler,
	 * like configuration files or assets that are dynamically imported at runtime.
	 *
	 * Note: File paths are resolved relative to your project's `root`. Absolute paths may not work as expected.
	 *
	 * @example
	 * ```js
	 * includeFiles: ['./src/data/*.json', './src/locales/*.yml', './src/config/*.yaml']
	 * ```
	 */
	includeFiles?: string[];
	/**
	 * Exclude files from the bundling process.
	 * This is useful for excluding any type of file that is not intended to be bundled with your SSR function,
	 * such as large assets, temporary files, or sensitive local configuration files.
	 *
	 * @example
	 * ```js
	 * excludeFiles: ['./src/secret/*.json', './src/temp/*.txt']
	 * ```
	 */
	excludeFiles?: string[];
	/**
	 * If enabled, On-Demand-Rendered pages are cached for up to a year.
	 * This is useful for pages that are not updated often, like a blog post,
	 * but that you have too many of to pre-render at build time.
	 *
	 * You can override this behavior on a per-page basis
	 * by setting the `Cache-Control`, `CDN-Cache-Control` or `Netlify-CDN-Cache-Control` header
	 * from within the Page:
	 *
	 * ```astro
	 * // src/pages/cached-clock.astro
	 * Astro.response.headers.set('CDN-Cache-Control', "public, max-age=45, must-revalidate");
	 * ---
	 * <p>{Date.now()}</p>
	 * ```
	 */
	cacheOnDemandPages?: boolean;
	/**
	 * Controls when and how middleware executes.
	 * - 'classic' (default): Middleware runs for prerendered pages at build time, and for SSR pages at request time.
	 * - 'edge': Middleware is deployed as a separate edge function. Recommended if you want to implement authentication, redirects, or similar things.
	 */
	middlewareMode?: MiddlewareMode;
	/**
	 * @deprecated Use `middlewareMode: 'edge'` instead.
	 *
	 * If enabled, Astro Middleware is deployed as an Edge Function and applies to all routes.
	 * Caveat: Locals set in Middleware are not applied to prerendered pages, because they've been rendered at build-time and are served from the CDN.
	 *
	 * @default {false}
	 */
	edgeMiddleware?: boolean;
	/**
	 * If enabled, Netlify Image CDN is used for image optimization.
	 * This transforms images on-the-fly without impacting build times.
	 *
	 * If disabled, Astro's built-in image optimization is run at build-time instead.
	 *
	 * @default {true}
	 */
	imageCDN?: boolean;
	/**
	 * If enabled, the adapter will save [static headers in the framework API file](https://docs.netlify.com/frameworks-api/#headers).
	 *
	 * Here the list of the headers that are added:
	 * - The CSP header of the static pages is added when CSP support is enabled.
	 */
	staticHeaders?: boolean;
	/**
	 * Netlify features to enable when running `astro dev`. These work best when your site is linked to a Netlify site using `netlify link`.
	 *
	 * Either a boolean to enable or disable all features, or an object to enable specific features.
	 *
	 * - `images`: Enables the Netlify Image CDN in local development. Default: true
	 * - `environmentVariables`: If your site is linked to a Netlify site, this will automatically load the environment variables from the Netlify site or team. Default: false
	 *
	 * @default {{ environmentVariables: false, images: true }}
	 */
	devFeatures?:
		| {
				environmentVariables: boolean;
				images: boolean;
		  }
		| boolean;
}
export default function netlifyIntegration(
	integrationConfig?: NetlifyIntegrationConfig,
): AstroIntegration;
export {};
