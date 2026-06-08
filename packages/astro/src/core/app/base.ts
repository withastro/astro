import {
	collapseDuplicateLeadingSlashes,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { matchPattern } from '@astrojs/internal-helpers/remote';
import { computePathnameFromDomain } from '../i18n/domain.js';
import type { RoutesList } from '../../types/astro.js';
import type { RemotePattern, RouteData } from '../../types/public/index.js';
import { type Pipeline, PipelineFeatures } from '../base-pipeline.js';
import { ASTRO_ERROR_HEADER, clientAddressSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';

import { AstroError, AstroErrorData } from '../errors/index.js';
import { AstroIntegrationLogger, type AstroLogger } from '../logger/core.js';

import { DefaultFetchHandler } from '../fetch/default-handler.js';
import type { FetchHandler } from '../fetch/types.js';
import { appSymbol } from '../constants.js';
import { DefaultErrorHandler } from '../errors/default-handler.js';
import type { ErrorHandler } from '../errors/handler.js';
import { setRenderOptions } from './render-options.js';
import { MultiLevelEncodingError } from '../util/pathname.js';
import type { WaitUntilHook } from '../wait-until.js';
import type { AppPipeline } from './pipeline.js';
import type { SSRManifest } from './types.js';

export interface DevMatch {
	routeData: RouteData;
	resolvedPathname: string;
}

export interface RenderOptions {
	/**
	 * Whether to automatically add all cookies written by `Astro.cookie.set()` to the response headers.
	 *
	 * When set to `true`, they will be added to the `Set-Cookie` header as comma-separated key=value pairs. You can use the standard `response.headers.getSetCookie()` API to read them individually.
	 *
	 * When set to `false`, the cookies will only be available from `App.getSetCookieFromResponse(response)`.
	 *
	 * @default {false}
	 */
	addCookieHeader?: boolean;

	/**
	 * The client IP address that will be made available as `Astro.clientAddress` in pages, and as `ctx.clientAddress` in API routes and middleware.
	 *
	 * Default: `request[Symbol.for("astro.clientAddress")]`
	 */
	clientAddress?: string;

	/**
	 * The mutable object that will be made available as `Astro.locals` in pages, and as `ctx.locals` in API routes and middleware.
	 */
	locals?: object;

	/**
	 * A custom fetch function for retrieving prerendered pages - 404 or 500.
	 *
	 * If not provided, Astro will fall back to its default behavior for fetching error pages.
	 *
	 * When a dynamic route is matched but ultimately results in a 404, this function will be used
	 * to fetch the prerendered 404 page if available. Similarly, it may be used to fetch a
	 * prerendered 500 error page when necessary.
	 *
	 * @param {ErrorPagePath} url - The URL of the prerendered 404 or 500 error page to fetch.
	 * @returns {Promise<Response>} A promise resolving to the prerendered response.
	 */
	prerenderedErrorPageFetch?: (url: ErrorPagePath) => Promise<Response>;

	/**
	 * Optional platform hook to keep background work alive after the response is sent.
	 *
	 * Adapters can pass this through so runtime cache providers can schedule cache writes
	 * without blocking the response path.
	 */
	waitUntil?: WaitUntilHook;

	/**
	 * **Advanced API**: you probably do not need to use this.
	 *
	 * Default: `app.match(request)`
	 */
	routeData?: RouteData;
}

type RequiredRenderOptions = Required<RenderOptions>;

export interface ResolvedRenderOptions {
	addCookieHeader: RequiredRenderOptions['addCookieHeader'];
	clientAddress: RequiredRenderOptions['clientAddress'] | undefined;
	prerenderedErrorPageFetch: RequiredRenderOptions['prerenderedErrorPageFetch'] | undefined;
	locals: RequiredRenderOptions['locals'] | undefined;
	routeData: RequiredRenderOptions['routeData'] | undefined;
	waitUntil: RequiredRenderOptions['waitUntil'] | undefined;
}

export interface RenderErrorOptions extends ResolvedRenderOptions {
	response?: Response;
	status: 404 | 500;
	/**
	 * Whether to skip middleware while rendering the error page. Defaults to false.
	 */
	skipMiddleware?: boolean;
	/**
	 * Allows passing an error to 500.astro. It will be available through `Astro.props.error`.
	 */
	error?: unknown;
	/**
	 * The pathname to use for the error page render context. If omitted, the
	 * error handler computes it from `request` via a short-lived `FetchState`.
	 */
	pathname?: string;
}

type ErrorPagePath =
	| `${string}/404`
	| `${string}/500`
	| `${string}/404/`
	| `${string}/500/`
	| `${string}404.html`
	| `${string}500.html`;

export abstract class BaseApp<P extends Pipeline = AppPipeline> {
	manifest: SSRManifest;
	manifestData: { routes: RouteData[] };
	pipeline: P;
	#adapterLogger: AstroIntegrationLogger | undefined;
	baseWithoutTrailingSlash: string;
	/**
	 * The handler that turns incoming `Request` objects into `Response`s.
	 * Defaults to a `DefaultFetchHandler` pinned to this app and can be
	 * overridden via `setFetchHandler` — typically by the bundled
	 * entrypoint after importing `virtual:astro:fetchable`.
	 */
	#fetchHandler: { fetch: FetchHandler };
	#errorHandler: ErrorHandler;

	/**
	 * Whether a custom fetch handler (from `src/app.ts`) has been set
	 * via `setFetchHandler`. When false, the `DefaultFetchHandler` is
	 * in use and all features are implicitly active.
	 */
	#hasCustomFetchHandler = false;

	/**
	 * Whether the missing-feature check has already run. We only want
	 * to warn once — after the first request in dev, or at build end.
	 */
	#featureCheckDone = false;

	get logger(): AstroLogger {
		return this.pipeline.logger;
	}

	get adapterLogger(): AstroIntegrationLogger {
		const currentOptions = this.logger.options;
		if (!this.#adapterLogger || this.#adapterLogger.options !== currentOptions) {
			this.#adapterLogger = new AstroIntegrationLogger(currentOptions, this.manifest.adapterName);
		}
		return this.#adapterLogger;
	}

	constructor(manifest: SSRManifest, streaming = true, ...args: any[]) {
		this.manifest = manifest;
		this.baseWithoutTrailingSlash = removeTrailingForwardSlash(manifest.base);
		this.pipeline = this.createPipeline(streaming, manifest, ...args);
		// Share the pipeline's manifestData so both BaseApp and the pipeline
		// see the same routes array (the pipeline constructor already
		// ensures a 404 fallback route is present).
		this.manifestData = this.pipeline.manifestData;
		this.#fetchHandler = new DefaultFetchHandler(this);
		this.#errorHandler = this.createErrorHandler();
	}

	/**
	 * Override the fetch handler used to dispatch requests. Entrypoints
	 * call this with the default export of `virtual:astro:fetchable` to
	 * plug in a user-authored handler from `src/app.ts`.
	 */
	setFetchHandler(handler: { fetch: FetchHandler }): void {
		this.#fetchHandler = handler;
		this.#hasCustomFetchHandler = !(handler instanceof DefaultFetchHandler);
	}

	/**
	 * Returns the error handler strategy used by this app. Override to
	 * provide environment-specific behavior (dev overlay, build-time throws, etc.).
	 */
	protected createErrorHandler(): ErrorHandler {
		return new DefaultErrorHandler(this);
	}

	public abstract isDev(): boolean;

	/**
	 * Resets the cached adapter logger so it picks up a new logger instance.
	 * Used by BuildApp when the logger is replaced via setOptions().
	 */
	protected resetAdapterLogger(): void {
		this.#adapterLogger = undefined;
	}

	getAllowedDomains() {
		return this.manifest.allowedDomains;
	}

	protected matchesAllowedDomains(forwardedHost: string, protocol?: string): boolean {
		return BaseApp.validateForwardedHost(forwardedHost, this.manifest.allowedDomains, protocol);
	}

	static validateForwardedHost(
		forwardedHost: string,
		allowedDomains?: Partial<RemotePattern>[],
		protocol?: string,
	): boolean {
		if (!allowedDomains || allowedDomains.length === 0) {
			return false;
		}

		try {
			const testUrl = new URL(`${protocol || 'https'}://${forwardedHost}`);
			return allowedDomains.some((pattern) => {
				return matchPattern(testUrl, pattern);
			});
		} catch {
			// Invalid URL
			return false;
		}
	}

	/**
	 * Creates a pipeline by reading the stored manifest
	 *
	 * @param streaming
	 * @param manifest
	 * @param args
	 * @private
	 */
	abstract createPipeline(streaming: boolean, manifest: SSRManifest, ...args: any[]): P;

	set setManifestData(newManifestData: RoutesList) {
		this.manifestData = newManifestData;
		this.pipeline.manifestData = newManifestData;
		this.pipeline.rebuildRouter();
	}

	public removeBase(pathname: string) {
		// Collapse multiple leading slashes to prevent middleware authorization bypass.
		// Without this, `//admin` would be treated as starting with base `/` and sliced
		// to `/admin` for routing, while middleware still sees `//admin` in the URL.
		pathname = collapseDuplicateLeadingSlashes(pathname);
		if (pathname.startsWith(this.manifest.base)) {
			return pathname.slice(this.baseWithoutTrailingSlash.length + 1);
		}
		return pathname;
	}

	/**
	 * Decodes a pathname with `decodeURI`, falling back to the raw pathname when it
	 * contains an invalid percent-sequence (e.g. `%C0%AF`, an overlong-UTF-8 encoding of
	 * `/` commonly sent by path-traversal scanners). A raw `decodeURI()` would throw
	 * `URIError: URI malformed`, and because `match()` runs before `render()` that error
	 * escapes the adapter's request handler as an uncaught exception (HTTP 500) that user
	 * middleware can't catch.
	 */
	private safeDecodeURI(pathname: string): string {
		try {
			return decodeURI(pathname);
		} catch (e: any) {
			// Malformed request paths are expected client input (commonly from automated
			// scanners) rather than a server fault, and this runs per-request on the hot
			// path. Log at `debug` so it stays diagnosable without flooding error logs.
			this.adapterLogger.debug(e.toString());
			return pathname;
		}
	}

	/**
	 * Extracts the base-stripped, decoded pathname from a request.
	 * Used by adapters to compute the pathname for dev-mode route matching.
	 */
	public getPathnameFromRequest(request: Request): string {
		const url = new URL(request.url);
		const pathname = prependForwardSlash(this.removeBase(url.pathname));
		return this.safeDecodeURI(pathname);
	}

	/**
	 * Given a `Request`, it returns the `RouteData` that matches its `pathname`. By default, prerendered
	 * routes aren't returned, even if they are matched.
	 *
	 * When `allowPrerenderedRoutes` is `true`, the function returns matched prerendered routes too.
	 * @param request
	 * @param allowPrerenderedRoutes
	 */
	public match(request: Request, allowPrerenderedRoutes = false): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.manifest.assets.has(url.pathname)) return undefined;
		let pathname = this.computePathnameFromDomain(request);
		if (!pathname) {
			pathname = prependForwardSlash(this.removeBase(url.pathname));
		}
		const routeData = this.pipeline.matchRoute(this.safeDecodeURI(pathname));
		if (!routeData) return undefined;
		if (allowPrerenderedRoutes) {
			return routeData;
		}
		// Prerendered routes are served as static files by the hosting layer.
		// When the first match is a prerendered *dynamic* route, try to find
		// a non-prerendered route that can serve this path. Dynamic prerendered
		// routes only cover their specific static paths, so an SSR route with
		// the same pattern should handle all other URLs.
		if (routeData.prerender) {
			if (routeData.params.length > 0) {
				const allMatches = this.pipeline.matchAllRoutes(this.safeDecodeURI(pathname));
				return allMatches.find((r) => !r.prerender);
			}
			return undefined;
		}
		return routeData;
	}

	/**
	 * A matching route function to use in the development server.
	 * Contrary to the `.match` function, this function resolves props and params, returning the correct
	 * route based on the priority, segments. It also returns the correct, resolved pathname.
	 * @param pathname
	 */

	public devMatch(pathname?: string): Promise<DevMatch | undefined> | undefined {
		pathname;
		return undefined;
	}

	private computePathnameFromDomain(request: Request): string | undefined {
		return computePathnameFromDomain(
			request,
			new URL(request.url),
			this.manifest.i18n,
			this.manifest.base,
			this.manifest.trailingSlash,
			this.logger,
		);
	}

	public async render(
		request: Request,
		{
			addCookieHeader = false,
			clientAddress = Reflect.get(request, clientAddressSymbol),
			locals,
			prerenderedErrorPageFetch = fetch,
			routeData,
			waitUntil,
		}: RenderOptions = {},
	): Promise<Response> {
		// Lazily resolve the logger destination from the manifest on the first request.
		// This swaps the user-configured logger destination (if any) into the shared
		// AstroLogger instance before any logging occurs.
		await this.pipeline.getLogger();

		if (routeData) {
			this.logger.debug(
				'router',
				'The adapter ' + this.manifest.adapterName + ' provided a custom RouteData for ',
				request.url,
			);
			this.logger.debug('router', 'RouteData');
			this.logger.debug('router', routeData);
		}
		if (locals) {
			if (typeof locals !== 'object') {
				const error = new AstroError(AstroErrorData.LocalsNotAnObject);
				this.logger.error(null, error.stack!);
				return this.renderError(request, {
					addCookieHeader,
					clientAddress,
					prerenderedErrorPageFetch,
					// If locals are invalid, we don't want to include them when
					// rendering the error page
					locals: undefined,
					routeData,
					waitUntil,
					status: 500,
					error,
				});
			}
		}
		// For domain-based i18n, match against the locale-prefixed pathname
		// derived from the Host header. FetchState recomputes this pathname
		// itself for param/locale resolution, so it isn't threaded through here.
		if (!routeData) {
			const domainPathname = this.computePathnameFromDomain(request);
			if (domainPathname) {
				routeData = this.pipeline.matchRoute(this.safeDecodeURI(domainPathname));
			}
		}
		const resolvedOptions: ResolvedRenderOptions = {
			addCookieHeader,
			clientAddress,
			prerenderedErrorPageFetch,
			locals,
			routeData,
			waitUntil,
		};

		let response: Response;
		try {
			if (this.#fetchHandler instanceof DefaultFetchHandler) {
				// Fast path: pass options directly, skip Reflect.set/get round-trip
				Reflect.set(request, appSymbol, this);
				response = await this.#fetchHandler.renderWithOptions(request, resolvedOptions);
			} else {
				// User-provided fetch handler: stamp options + app on the request
				setRenderOptions(request, resolvedOptions);
				Reflect.set(request, appSymbol, this);
				response = await this.#fetchHandler.fetch(request);
			}
		} catch (err: any) {
			// Multi-level encoding (e.g., %2561 → %61) is rejected during URL
			// normalization in FetchState. Return 400 without rendering an error page.
			if (err instanceof MultiLevelEncodingError) {
				return new Response('Bad Request', { status: 400 });
			}
			throw err;
		}
		this.#warnMissingFeatures();
		if (response.headers.get(ASTRO_ERROR_HEADER)) {
			response.headers.delete(ASTRO_ERROR_HEADER);
			return this.renderError(request, {
				addCookieHeader,
				clientAddress,
				prerenderedErrorPageFetch,
				locals,
				routeData,
				waitUntil,
				response,
				status: response.status as 404 | 500,
				error: response.status === 500 ? null : undefined,
			});
		}
		return response;
	}

	setCookieHeaders(response: Response) {
		return getSetCookiesFromResponse(response);
	}

	/**
	 * Reads all the cookies written by `Astro.cookie.set()` onto the passed response.
	 * For example,
	 * ```ts
	 * for (const cookie_ of App.getSetCookieFromResponse(response)) {
	 *     const cookie: string = cookie_
	 * }
	 * ```
	 * @param response The response to read cookies from.
	 * @returns An iterator that yields key-value pairs as equal-sign-separated strings.
	 */
	static getSetCookieFromResponse = getSetCookiesFromResponse;

	/**
	 * If it is a known error code, try sending the according page (e.g. 404.astro / 500.astro).
	 * This also handles pre-rendered /404 or /500 routes.
	 *
	 * Delegates to the app's configured `ErrorHandler`. To customize behavior
	 * for a specific environment, override `createErrorHandler()` rather than
	 * this method.
	 */
	public async renderError(request: Request, options: RenderErrorOptions): Promise<Response> {
		return this.#errorHandler.renderError(request, options);
	}

	/**
	 * One-shot check: after the first request with a custom `src/app.ts`,
	 * compare `usedFeatures` against the manifest and warn about any
	 * configured features the user's pipeline doesn't call.
	 */
	#warnMissingFeatures(): void {
		if (this.#featureCheckDone || !this.#hasCustomFetchHandler) return;
		this.#featureCheckDone = true;

		const manifest = this.manifest;
		const missing: string[] = [];

		const used = this.pipeline.usedFeatures;

		if (
			manifest.routes.some((r) => r.routeData.type === 'redirect') &&
			!(used & PipelineFeatures.redirects)
		) {
			missing.push('redirects');
		}
		if (manifest.sessionConfig && !(used & PipelineFeatures.sessions)) {
			missing.push('sessions');
		}
		if (manifest.actions && !(used & PipelineFeatures.actions)) {
			missing.push('actions');
		}
		if (manifest.middleware && !(used & PipelineFeatures.middleware)) {
			missing.push('middleware');
		}
		if (manifest.i18n && manifest.i18n.strategy !== 'manual' && !(used & PipelineFeatures.i18n)) {
			missing.push('i18n');
		}
		if (manifest.cacheConfig && !(used & PipelineFeatures.cache)) {
			missing.push('cache');
		}

		for (const feature of missing) {
			this.logger.warn(
				'router',
				`Your project uses ${feature}, but your custom src/app.ts does not call the ${feature}() handler. ` +
					`This feature will not work unless you add it to your app.ts pipeline.`,
			);
		}
	}

	getDefaultStatusCode(routeData: RouteData, pathname: string): number {
		if (!routeData.pattern.test(pathname)) {
			for (const fallbackRoute of routeData.fallbackRoutes) {
				if (fallbackRoute.pattern.test(pathname)) {
					return 302;
				}
			}
		}
		const route = removeTrailingForwardSlash(routeData.route);
		if (route.endsWith('/404')) return 404;
		if (route.endsWith('/500')) return 500;
		return 200;
	}

	public getManifest() {
		return this.pipeline.manifest;
	}

	logThisRequest({
		pathname,
		method,
		statusCode,
		isRewrite,
		timeStart,
	}: {
		pathname: string;
		method: string;
		statusCode: number;
		isRewrite: boolean;
		timeStart: number;
	}) {
		const timeEnd = performance.now();
		this.logRequest({
			pathname,
			method,
			statusCode,
			isRewrite,
			reqTime: timeEnd - timeStart,
		});
	}

	public abstract logRequest(_options: LogRequestPayload): void;
}

export type LogRequestPayload = {
	/**
	 * The current path being rendered
	 */
	pathname: string;
	/**
	 * The method of the request
	 */
	method: string;
	/**
	 * The status code of the request
	 */
	statusCode: number;
	/**
	 * If the current request is a rewrite
	 */
	isRewrite: boolean;
	/**
	 * How long it took to render the request
	 */
	reqTime: number;
};
