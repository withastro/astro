/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
	CspDirective,
	CspHashEntry,
	CspResourceEntry,
} from '@astrojs/runtime/_internal/core/csp/sources.js';
import type { AstroCookies } from './internal/core/cookies/cookies.js';
import type { ValidRedirectStatus } from './types.js';

declare global {
	namespace App {
		interface Locals {}
	}
}

declare module '@astrojs/vite-plugin-astro' {
	interface AstroGlobalExtensions<
		Props extends Record<string, any>,
		Params extends Record<string, string | undefined>,
	> extends APIContext<Props, Params> {
		/**
		 * A standard [ResponseInit](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#init) object describing the outgoing response.
		 *
		 * ## Example
		 *
		 * You can change the status code by assigning a value to this property:
		 * ```typescript
		 * Astro.response.status = 404;
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#response)
		 */
		response: ResponseInit & {
			readonly headers: Headers;
		};
	}
}

/** What `Astro.rewrite()`, `context.rewrite()` and middleware `next()` accept. */
export type RewritePayload = string | URL | Request;

/**
 * A type containing functions for logging messages.
 *
 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#logger)
 */
export interface AstroRuntimeLogger {
	/**
	 * Logs a message with `info` level.
	 */
	info: (msg: string) => void;
	/**
	 * Logs a message with `warn` level.
	 */
	warn: (msg: string) => void;
	/**
	 * Logs a message with `error` level.
	 */
	error: (msg: string) => void;
}

/**
 * Members that features add to `APIContext` (and therefore to the `Astro` global) through
 * declaration merging, alongside an `api.astroRouter.extendRenderContext()` registration that
 * provides the value at runtime.
 *
 * Repeat both type parameters with the same names and constraints:
 *
 * ```ts
 * declare module '@astrojs/vite-plugin-router' {
 *   interface APIContextExtensions<
 *     Props extends Record<string, any>,
 *     Params extends Record<string, string | undefined>,
 *   > {
 *     session: AstroSession | undefined;
 *   }
 * }
 * ```
 */
// @ts-expect-error TS6205: the type parameters are used by merged declarations
export interface APIContextExtensions<
	// biome-ignore lint/correctness/noUnusedVariables: used by merged declarations
	Props extends Record<string, any> = Record<string, any>,
	// biome-ignore lint/correctness/noUnusedVariables: used by merged declarations
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> {}

/**
 * The `APIContext` is the object made available to endpoints and middleware.
 * It is a subset of the `Astro` global object available in pages.
 *
 * [Astro reference](https://docs.astro.build/en/reference/api-reference/)
 */
export interface APIContext<
	Props extends Record<string, any> = Record<string, any>,
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> extends APIContextExtensions<Props, Params> {
	/**
	 * The site provided in the astro config, parsed as an instance of `URL`, without base.
	 * `undefined` if the site is not provided in the config.
	 *
	 * ## Example
	 *
	 * ```astro
	 * <link
	 *   rel="alternate"
	 *   type="application/rss+xml"
	 *   title="Your Site's Title"
	 *   href={new URL("rss.xml", Astro.site)}
	 * />
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#site)
	 */
	site: URL | undefined;

	/**
	 * A human-readable string representing the Astro version used to create the project. It follows the format "Astro v5.x.x".
	 *
	 * ## Example
	 *
	 * ```astro
	 * <meta name="generator" content={Astro.generator} />
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#generator)
	 */
	generator: string;

	/**
	 * The address (usually IP address) of the user.
	 *
	 * Throws an error if used within a static site, or within a prerendered page.
	 *
	 * ## Example
	 *
	 * ```ts
	 * import type { APIContext } from 'astro';
	 *
	 * export function GET({ clientAddress }: APIContext) {
	 *   return new Response(`Your IP address is: ${clientAddress}`);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#clientaddress)
	 */
	clientAddress: string;

	/**
	 * An object containing utilities for reading and manipulating the values of cookies in on-demand routes.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cookies)
	 */
	cookies: AstroCookies;

	/**
	 * A standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object containing information about the current request.
	 *
	 * ## Example
	 *
	 * To get a URL object of the current URL, you can use:
	 * ```typescript
	 * const url = new URL(Astro.request.url);
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#request)
	 */
	request: Request;

	/**
	 * A URL object constructed from the current `request.url` value. This is
	 * equivalent to doing `new URL(context.request.url)`.
	 *
	 * ## Example
	 *
	 * ```astro
	 * <p>The current URL is: {Astro.url}</p>
	 * <p>The current URL pathname is: {Astro.url.pathname}</p>
	 * <p>The current URL origin is: {Astro.url.origin}</p>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#url)
	 */
	url: URL;

	/**
	 * The origin pathname of the request URL.
	 * Useful to track the original URL before rewrites were applied.
	 *
	 * ## Example
	 *
	 * ```astro
	 * <p>The origin path is {Astro.originPathname}</p>
	 * <p>The rewritten path is {Astro.url.pathname}</p>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#originpathname)
	 */
	originPathname: string;

	/**
	 * An object containing the values of dynamic route segments matched for a request.
	 *
	 * In static builds, this will be the `params` returned by [`getStaticPaths()`](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths). With on-demand rendering, `params` can be any value matching the path segments in the dynamic route pattern.
	 *
	 * ## Example
	 *
	 * ```ts
	 * import type { APIContext } from "astro"
	 *
	 * export function getStaticPaths() {
	 *   return [
	 *     { params: { id: '0' }, props: { name: 'Sarah' } },
	 *     { params: { id: '1' }, props: { name: 'Chris' } },
	 *     { params: { id: '2' }, props: { name: 'Fuzzy' } },
	 *   ];
	 * }
	 *
	 * export function GET({ params }: APIContext): Response {
	 *   return new Response(`The current id is ${params.id}.`);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#params)
	 */
	params: Params;

	/**
	 * An object containing any values that have been passed as component attributes. In static builds, this can also be the `props` returned by [`getStaticPaths()`](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths).
	 *
	 * ## Example
	 *
	 * ```ts
	 * import type { APIContext } from "astro"
	 *
	 * export function getStaticPaths() {
	 *   return [
	 *     { params: { id: '0' }, props: { name: 'Sarah' } },
	 *     { params: { id: '1' }, props: { name: 'Chris' } },
	 *     { params: { id: '2' }, props: { name: 'Fuzzy' } },
	 *   ];
	 * }
	 *
	 * export function GET({ props }: APIContext): Response {
	 *   return new Response(`Hello ${props.name}!`);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#props)
	 */
	props: Props;

	/**
	 * Creates a response that redirects to another page.
	 *
	 * This accepts a custom status code when redirecting for on-demand rendered routes only.
	 *
	 * @param {string} path - The path to redirect to.
	 * @param {ValidRedirectStatus} [status] - An optional HTTP status code.
	 * @returns {Response} A Response object describing the redirection.
	 *
	 * ## Example
	 *
	 * ```ts
	 * // src/pages/secret.ts
	 * export function GET({ redirect }) {
	 *   return redirect('/login');
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#redirect)
	 */
	redirect: (path: string, status?: ValidRedirectStatus) => Response;

	/**
	 * Allows you to serve content from a different URL or path without
	 * redirecting the browser to a new page.
	 *
	 * As opposed to redirects, the URL won't change, and Astro will render the
	 * HTML emitted by the rerouted URL passed as argument.
	 *
	 * @param {RewritePayload} rewritePayload - The location of the path.
	 * @returns {Promise<Response>} A Response object describing the rewrite.
	 *
	 * ## Example
	 *
	 * ```ts
	 * // src/pages/secret.ts
	 * export function GET(ctx) {
	 *   return ctx.rewrite(new URL("../"), ctx.url);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#rewrite)
	 */
	rewrite: (rewritePayload: RewritePayload) => Promise<Response>;

	/**
	 * An object that middlewares can use to store extra information related to the request.
	 *
	 * It will be made available to pages as `Astro.locals`, and to endpoints as `context.locals`.
	 *
	 * ## Example
	 *
	 * ```ts
	 * // src/middleware.ts
	 * import { defineMiddleware } from "astro:middleware";
	 *
	 * export const onRequest = defineMiddleware((context, next) => {
	 *   context.locals.greeting = "Hello!";
	 *   return next();
	 * });
	 * ```
	 * You can then access the value inside a `.astro` file:
	 * ```astro
	 * ---
	 * // src/pages/index.astro
	 * const greeting = Astro.locals.greeting;
	 * ---
	 * <h1>{greeting}</h1>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#locals)
	 */
	locals: App.Locals;

	/**
	 * Whether the current route is prerendered or not.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#isprerendered)
	 */
	isPrerendered: boolean;

	/**
	 * Exposes utilities to control CSP headers from your pages, endpoints, and middleware.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#csp)
	 */
	csp:
		| {
				/**
				 * Adds a specific CSP directive to the route being rendered.
				 *
				 * @param {CspDirective} directive - The directive to add to the current page.
				 *
				 * ## Example
				 *
				 * ```js
				 * ctx.insertDirective("default-src 'self' 'unsafe-inline' https://example.com")
				 * ```
				 *
				 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cspinsertdirective)
				 */
				insertDirective: (directive: CspDirective) => void;

				/**
				 * Sets the resource for the `style-src` family of directives in the route being rendered. It overrides Astro's default.
				 *
				 * Pass a bare string to add the source to `style-src`, or an object with a `kind` to scope it:
				 * `"element"` → `style-src-elem`, `"attribute"` → `style-src-attr`, `"default"` → `style-src`.
				 *
				 * @param {string | { resource: string; kind?: "element" | "attribute" | "default" }} payload - The source to insert.
				 *
				 * ## Example
				 *
				 * ```js
				 * ctx.insertStyleResource("https://styles.cdn.example.com/")
				 * ctx.insertStyleResource({ resource: "'unsafe-inline'", kind: "attribute" })
				 * ```
				 *
				 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cspinsertstyleresource)
				 */
				insertStyleResource: (payload: CspResourceEntry) => void;

				/**
				 * Inserts a single style hash to the route being rendered.
				 *
				 * Pass a bare hash to add it to `style-src`, or an object with a `kind` to scope it:
				 * `"element"` → `style-src-elem`, `"attribute"` → `style-src-attr`, `"default"` → `style-src`.
				 *
				 * @param {CspHash | { hash: CspHash; kind?: "element" | "attribute" | "default" }} payload - The hash to insert.
				 *
				 * ## Example
				 *
				 * ```js
				 * ctx.insertStyleHash("sha256-1234567890abcdef1234567890")
				 * ctx.insertStyleHash({ hash: "sha256-1234567890abcdef1234567890", kind: "element" })
				 * ```
				 *
				 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cspinsertstylehash)
				 */
				insertStyleHash: (payload: CspHashEntry) => void;

				/**
				 * Sets the resource for the `script-src` family of directives in the route being rendered.
				 *
				 * Pass a bare string to add the source to `script-src`, or an object with a `kind` to scope it:
				 * `"element"` → `script-src-elem`, `"attribute"` → `script-src-attr`, `"default"` → `script-src`.
				 *
				 * @param {string | { resource: string; kind?: "element" | "attribute" | "default" }} payload - The source to insert.
				 *
				 * ## Example
				 *
				 * ```js
				 * ctx.insertScriptResource("https://scripts.cdn.example.com/")
				 * ctx.insertScriptResource({ resource: "https://scripts.cdn.example.com/", kind: "element" })
				 * ```
				 *
				 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cspinsertscriptresource)
				 */
				insertScriptResource: (payload: CspResourceEntry) => void;

				/**
				 * Inserts a single script hash to the route being rendered.
				 *
				 * Pass a bare hash to add it to `script-src`, or an object with a `kind` to scope it:
				 * `"element"` → `script-src-elem`, `"attribute"` → `script-src-attr`, `"default"` → `script-src`.
				 *
				 * @param {CspHash | { hash: CspHash; kind?: "element" | "attribute" | "default" }} payload - The hash to insert.
				 *
				 * ## Example
				 *
				 * ```js
				 * ctx.insertScriptHash("sha256-1234567890abcdef1234567890")
				 * ctx.insertScriptHash({ hash: "sha256-1234567890abcdef1234567890", kind: "element" })
				 * ```
				 *
				 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cspinsertscripthash)
				 */
				insertScriptHash: (payload: CspHashEntry) => void;
		  }
		| undefined;

	/**
	 * It exposes utilities for logging messages.
	 */
	logger: AstroRuntimeLogger;

	/**
	 * The route currently rendered. It's stripped of the `srcDir` and the `pages` folder, and it doesn't contain the extension.
	 *
	 * ## Example
	 *
	 * - The value when rendering `src/pages/index.astro` will be `/`.
	 * - The value when rendering `src/pages/blog/[slug].astro` will be `/blog/[slug]`.
	 * - The value when rendering `src/pages/[...path].astro` will be `/[...path]`.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/routing-reference/#routepattern)
	 */
	routePattern: string;
}

/**
 * The request-scoped part of `APIContext`, available before the route's props are resolved:
 * everything except `props`, `redirect` and `rewrite`. Actions run against it.
 */
export type RequestAPIContext = Omit<APIContext, 'props' | 'redirect' | 'rewrite'>;
