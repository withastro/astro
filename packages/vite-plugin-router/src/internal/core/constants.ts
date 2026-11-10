import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../environment-names.js';
import type { ValidRedirectStatus } from '../../types.js';

export { ASTRO_GENERATOR } from '@astrojs/runtime/_internal/server/astro-global.js';

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
export const REDIRECT_STATUS_CODES = [
	301, 302, 303, 307, 308, 300, 304,
] as const satisfies readonly ValidRedirectStatus[];

/**
 * A response with one of these status codes will be rewritten
 * with the result of rendering the respective error page.
 */
export const REROUTABLE_STATUS_CODES = [404, 500];

/**
 * Pages Astro serves for an HTTP status rather than for their own URL.
 *
 * They are always written as `<name>.html`, never as `<name>/index.html`,
 * whatever `build.format` says, because a host reaches them by status code and
 * needs them at a predictable file path. Being status pages rather than site
 * content, they are also skipped by i18n routing.
 */
export const STATUS_CODE_PAGES = new Set(['/404', '/500', '/3xx']);

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
 * Use this symbol to stash the active `FetchState` on an `APIContext`
 * (or `ActionAPIContext`). Consumed by internal shims that need access
 * to per-request state without appearing in the public context shape
 * — e.g. the manual-strategy i18n middleware wrapper in
 * `src/i18n/middleware.ts`.
 */
export const fetchStateSymbol = Symbol.for('astro.fetchState');

/**
 * Use this symbol to opt into handling prerender routes in Astro core dev middleware.
 */
export const devPrerenderMiddlewareSymbol = Symbol.for('astro.devPrerenderMiddleware');

/**
 * A promise for background dev server app setup that must settle before Vite's
 * runnable environments are closed.
 */
export const devServerAppReadySymbol = Symbol.for('astro.devServerAppReady');

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

export { ASTRO_VITE_ENVIRONMENT_NAMES };

export type AstroEnvironmentNames =
	(typeof ASTRO_VITE_ENVIRONMENT_NAMES)[keyof typeof ASTRO_VITE_ENVIRONMENT_NAMES];

/** Module that exports the serialized server manifest as `manifest`. */
export const SERIALIZED_MANIFEST_ID = 'virtual:astro:manifest';
export const SERIALIZED_MANIFEST_RESOLVED_ID = '\0' + SERIALIZED_MANIFEST_ID;

/** Placeholder the build replaces with the serialized manifest. */
export const MANIFEST_REPLACE = '@@ASTRO_MANIFEST_REPLACE@@';
