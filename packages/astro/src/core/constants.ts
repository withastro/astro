// process.env.PACKAGE_VERSION is injected when we build and publish the astro package.
export const ASTRO_VERSION = process.env.PACKAGE_VERSION ?? 'development';

export const ASTRO_GENERATOR = `Astro v${ASTRO_VERSION}`;

/**
 * The name for the header used to help rerouting behavior.
 * When set to "no", astro will NOT try to reroute an error response to the corresponding error page, which is the default behavior that can sometimes lead to loops.
 *
 * ```ts
 * const response = new Response("keep this content as-is", {
 *     status: 404,
 *     headers: {
 *         // note that using a variable name as the key of an object needs to be wrapped in square brackets in javascript
 *         // without them, the header name will be interpreted as "REROUTE_DIRECTIVE_HEADER" instead of "X-Astro-Reroute"
 *         [REROUTE_DIRECTIVE_HEADER]: 'no',
 *     }
 * })
 * ```
 * Alternatively...
 * ```ts
 * response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
 * ```
 */
export const REROUTE_DIRECTIVE_HEADER = 'X-Astro-Reroute';

/**
 * Header and value that are attached to a Response object when a **user rewrite** occurs.
 *
 * This metadata is used to determine the origin of a Response. If a rewrite has occurred, it should be prioritised over other logic.
 */
export const REWRITE_DIRECTIVE_HEADER_KEY = 'X-Astro-Rewrite';

export const REWRITE_DIRECTIVE_HEADER_VALUE = 'yes';

/**
 * This header is set by the no-op Astro middleware.
 */
export const NOOP_MIDDLEWARE_HEADER = 'X-Astro-Noop';

/**
 * The name for the header used to help i18n middleware, which only needs to act on "page" and "fallback" route types.
 */
export const ROUTE_TYPE_HEADER = 'X-Astro-Route-Type';

/**
 * Internal headers that should be stripped from the response before
 * sending it to the user agent. Add new internal headers here so
 * `prepareResponse` removes them automatically.
 */
export const INTERNAL_RESPONSE_HEADERS = [
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	NOOP_MIDDLEWARE_HEADER,
	ROUTE_TYPE_HEADER,
] as const;

/**
 * Set by internal handlers (e.g. PagesHandler) to signal that a
 * response should be replaced with the corresponding error page.
 */
export const ASTRO_ERROR_HEADER = 'X-Astro-Error';

/**
 * The value of the `component` field of the default 404 page, which is used when there is no user-provided 404.astro page.
 */
export const DEFAULT_404_COMPONENT = 'astro-default-404.astro';

/**
 * A response with one of these status codes will create a redirect response.
 */
export const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308, 300, 304] as const;

/**
 * A response with one of these status codes will be rewritten
 * with the result of rendering the respective error page.
 */
export const REROUTABLE_STATUS_CODES = [404, 500];

/**
 * The symbol which is used as a field on the request object to store the client address.
 * The clientAddress provided by the adapter (or the dev server) is stored on this field.
 */
export const clientAddressSymbol = Symbol.for('astro.clientAddress');

/**
 * The symbol used as a field on the request object to store the object to be made available to Astro APIs as `locals`.
 * Use judiciously, as locals are now stored within `FetchState` by default. Tacking it onto request is no longer necessary.
 */
export const clientLocalsSymbol = Symbol.for('astro.locals');

/**
 * Use this symbol to set and retrieve the original pathname of a request. This is useful when working with redirects and rewrites
 */
export const originPathnameSymbol = Symbol.for('astro.originPathname');

/**
 * Use this symbol to set and retrieve the pipeline.
 */
export const pipelineSymbol = Symbol.for('astro.pipeline');

/**
 * Use this symbol to stash the active `FetchState` on an `APIContext`
 * (or `ActionAPIContext`). Consumed by internal shims that need access
 * to per-request state without appearing in the public context shape
 * — e.g. the manual-strategy i18n middleware wrapper in
 * `src/i18n/middleware.ts`.
 */
export const fetchStateSymbol = Symbol.for('astro.fetchState');

/**
 * Use this symbol to stash the `BaseApp` on an incoming `Request` at the
 * top of the pipeline. Fetch handlers loaded from `virtual:astro:fetchable`
 * (including `DefaultFetchHandler`) read it to find the app associated
 * with the current request without needing App passed to their constructor.
 */
export const appSymbol = Symbol.for('astro.app');

/**
 * Use this symbol to opt into handling prerender routes in Astro core dev middleware.
 */
export const devPrerenderMiddlewareSymbol = Symbol.for('astro.devPrerenderMiddleware');

/**
 * The symbol used as a field on the request object to store a cleanup callback associated with aborting the request when the underlying socket closes.
 */
export const nodeRequestAbortControllerCleanupSymbol = Symbol.for(
	'astro.nodeRequestAbortControllerCleanup',
);

/**
 * The symbol used as a field on the response object to keep track of streaming.
 *
 * It is set when the `<head>` element has been completely generated, rendered, and the response object has been passed onto the adapter.
 *
 * Used to provide helpful errors and warnings when headers or cookies are added during streaming, after the response has already been sent.
 */
export const responseSentSymbol = Symbol.for('astro.responseSent');

// possible extensions for markdown files
export const SUPPORTED_MARKDOWN_FILE_EXTENSIONS = [
	'.markdown',
	'.mdown',
	'.mkdn',
	'.mkd',
	'.mdwn',
	'.md',
] as const;

// The folder name where to find the middleware
export const MIDDLEWARE_PATH_SEGMENT_NAME = 'middleware';

// The environments used inside Astro
export const ASTRO_VITE_ENVIRONMENT_NAMES = {
	// It maps to the classic `ssr` Vite environment
	ssr: 'ssr',
	// It maps to the classic `client` Vite environment
	client: 'client',
	// Use this environment when `ssr` isn't a runnable dev environment, and you need
	// a runnable dev environment. A runnable dev environment allows you, for example,
	// to load a module via `runner.import`.
	//
	// This environment should be used only for dev, not production.
	astro: 'astro',
	// Environment used during the build for rendering static pages.
	// If your plugin runs in `ASTRO_VITE_ENVIRONMENT_NAMES.ssr`, you might
	// want to add `ASTRO_VITE_ENVIRONMENT_NAMES.prerender` too
	prerender: 'prerender',
} as const;

export type AstroEnvironmentNames =
	(typeof ASTRO_VITE_ENVIRONMENT_NAMES)[keyof typeof ASTRO_VITE_ENVIRONMENT_NAMES];
