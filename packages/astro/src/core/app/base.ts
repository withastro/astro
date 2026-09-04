import {
	prependForwardSlash,
	removeTrailingForwardSlash,
	stripRequestBase,
} from '@astrojs/internal-helpers/path';
import { matchPattern } from '@astrojs/internal-helpers/remote';
import { computePathnameFromDomain } from '../i18n/domain.js';
import type { RoutesList } from '../../types/astro.js';
import type { RemotePattern, RouteData } from '../../types/public/index.js';
import { ASTRO_ERROR_HEADER, clientAddressSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';

import { AstroError, AstroErrorData } from '../errors/index.js';
import { AstroIntegrationLogger, type AstroLogger } from '../logger/core.js';

import { DefaultFetchHandler } from '../fetch/default-handler.js';
import { getUsedFeatures, FetchFeatures } from '../fetch/features.js';
import { FetchState } from '../fetch/fetch-state.js';
import type { FetchHandler } from '../fetch/types.js';
import { type ErrorHandler, renderErrorPage } from '../errors/handler.js';
import { getLogger, getResolvedLogger } from '../logger/manifest-logger.js';
import { handleRequest } from '../routing/handler.js';
import { getDefaultStatusCode } from '../routing/helpers.js';
import { matchRequest } from '../routing/match-request.js';
import { getRouteTable, matchRoute, updateRouteTable } from '../routing/route-table.js';
import { validateAndDecodePathname } from '../util/pathname.js';
import { setRenderOptions } from './render-options.js';
import type { WaitUntilHook } from '../wait-until.js';
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
	| `${string}/404/index.html`
	| `${string}/500/index.html`
	| `${string}404.html`
	| `${string}500.html`;

export abstract class BaseApp {
	manifest: SSRManifest;
	#adapterLogger: AstroIntegrationLogger | undefined;
	baseWithoutTrailingSlash: string;
	/**
	 * The streaming flag passed to the constructor, surfaced through the
	 * protected `resolveStreaming()` hook and fed into the internal
	 * `FetchState` facade hooks on the fast path.
	 */
	#streaming: boolean;
	/**
	 * The handler that turns incoming `Request` objects into `Response`s.
	 * Defaults to a `DefaultFetchHandler` pinned to this app and can be
	 * overridden via `setFetchHandler` — typically by the bundled
	 * entrypoint after importing `virtual:astro:fetchable`.
	 */
	#fetchHandler: { fetch: FetchHandler };
	#errorHandler: ErrorHandler;

	/**
	 * Whether a custom fetch handler (from `src/fetch.ts`) has been set
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
		return getLogger(this.manifest);
	}

	/**
	 * Route data derived from the manifest, used for route matching. Reads and
	 * writes go through the single per-manifest route table, so HMR updates are
	 * visible to every consumer at once.
	 */
	get manifestData(): { routes: RouteData[] } {
		return getRouteTable(this.manifest);
	}

	set manifestData(routesList: { routes: RouteData[] }) {
		updateRouteTable(this.manifest, routesList.routes);
	}

	get adapterLogger(): AstroIntegrationLogger {
		const currentOptions = this.logger.options;
		if (!this.#adapterLogger || this.#adapterLogger.options !== currentOptions) {
			this.#adapterLogger = new AstroIntegrationLogger(currentOptions, this.manifest.adapterName);
		}
		return this.#adapterLogger;
	}

	constructor(manifest: SSRManifest, streaming = true) {
		this.manifest = manifest;
		this.baseWithoutTrailingSlash = removeTrailingForwardSlash(manifest.base);
		this.#streaming = streaming;
		// Warm the route table and logger so first-request latency doesn't
		// pay for their creation.
		getRouteTable(manifest);
		getLogger(manifest);
		this.#fetchHandler = new DefaultFetchHandler(this);
		this.#errorHandler = this.createErrorHandler();
	}

	/**
	 * Resolves the user-configured logger destination from the manifest and
	 * returns the logger. Lazy and only resolves once; safe to call before
	 * the first render (adapters use this to log startup messages through
	 * the configured destination).
	 */
	getLogger(): Promise<AstroLogger> {
		return getResolvedLogger(this.manifest);
	}

	/**
	 * The streaming flag fed into the internal `FetchState` facade hooks on
	 * the fast path. Returns the constructor flag by
	 * default; `BuildApp` overrides this to return `undefined` so streaming
	 * falls through to the environment default (`manifest.serverLike`).
	 */
	protected resolveStreaming(): boolean | undefined {
		return this.#streaming;
	}

	/**
	 * Override the fetch handler used to dispatch requests. Entrypoints
	 * call this with the default export of `virtual:astro:fetchable` to
	 * plug in a user-authored handler from `src/fetch.ts`.
	 */
	setFetchHandler(handler: { fetch: FetchHandler }): void {
		this.#fetchHandler = handler;
		this.#hasCustomFetchHandler = !(handler instanceof DefaultFetchHandler);
	}

	/**
	 * Returns the error handler used by this app. The default is a thin
	 * bridge over the functional error API — strategy selection (production
	 * default / dev / build) is environment-driven inside `renderErrorPage`.
	 * External subclasses can override this to customize error rendering.
	 */
	protected createErrorHandler(): ErrorHandler {
		return {
			renderError: (request, options) => renderErrorPage(this.manifest, request, options),
		};
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

	set setManifestData(newManifestData: RoutesList) {
		// One atomic table replacement: matcher, 404 fallback,
		// rewrites, and the `manifestData` accessors all read the same table.
		updateRouteTable(this.manifest, newManifestData.routes);
	}

	public removeBase(pathname: string) {
		return stripRequestBase(pathname, this.manifest.base);
	}

	/**
	 * Fully decodes a pathname, falling back to a single decode and then the raw pathname
	 * when validation fails. Adapter matching runs before `render()`, so it must not throw
	 * for request input that render-time validation handles.
	 */
	private safeDecodePathname(pathname: string): string {
		try {
			return validateAndDecodePathname(pathname);
		} catch (e: any) {
			// Path decoding failures are request input rather than a server fault. Log at
			// `debug` so they stay diagnosable without flooding error logs.
			this.adapterLogger.debug(e.toString());
			try {
				return decodeURI(pathname);
			} catch {
				return pathname;
			}
		}
	}

	/**
	 * Extracts the base-stripped, decoded pathname from a request.
	 * Used by adapters to compute the pathname for dev-mode route matching.
	 */
	public getPathnameFromRequest(request: Request): string {
		const url = new URL(request.url);
		const pathname = prependForwardSlash(this.removeBase(url.pathname));
		return this.safeDecodePathname(pathname);
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
		return matchRequest(this.manifest, request, allowPrerenderedRoutes);
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
		await getResolvedLogger(this.manifest);

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
				routeData = matchRoute(this.manifest, this.safeDecodePathname(domainPathname));
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
		if (this.#fetchHandler instanceof DefaultFetchHandler) {
			// Fast path: the facade constructs the state itself so it can pass
			// the internal facade hooks — per-App, per-render-call instance
			// behavior (late-bound so instance-property reassignments and
			// subclass overrides keep working). Nothing is stamped on the
			// request.
			response = await handleRequest(
				new FetchState(this.manifest, request, resolvedOptions, {
					streaming: this.resolveStreaming(),
					renderError: (req, opts) => this.renderError(req, opts),
					logRequest: (payload) => this.logThisRequest(payload),
				}),
			);
		} else {
			// User-provided fetch handler: only the resolved render() inputs
			// ride the `astro.renderOptions` request symbol — no manifest, no
			// callbacks, nothing internal. The handler's own
			// `new FetchState(request)` resolves the ambient manifest.
			setRenderOptions(request, resolvedOptions);
			response = await this.#fetchHandler.fetch(request);
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
	 * One-shot check: after the first request with a custom `src/fetch.ts`,
	 * compare `usedFeatures` against the manifest and warn about any
	 * configured features the user's pipeline doesn't call.
	 */
	#warnMissingFeatures(): void {
		if (this.#featureCheckDone || !this.#hasCustomFetchHandler) return;
		this.#featureCheckDone = true;

		const manifest = this.manifest;
		const missing: string[] = [];

		const used = getUsedFeatures(this.manifest);

		if (
			manifest.routes.some((r) => r.routeData.type === 'redirect') &&
			!(used & FetchFeatures.redirects)
		) {
			missing.push('redirects');
		}
		if (manifest.sessionConfig && !(used & FetchFeatures.sessions)) {
			missing.push('sessions');
		}
		if (manifest.actions && !(used & FetchFeatures.actions)) {
			missing.push('actions');
		}
		if (manifest.middleware && !(used & FetchFeatures.middleware)) {
			missing.push('middleware');
		}
		if (manifest.i18n && manifest.i18n.strategy !== 'manual' && !(used & FetchFeatures.i18n)) {
			missing.push('i18n');
		}
		if (manifest.cacheConfig && !(used & FetchFeatures.cache)) {
			missing.push('cache');
		}

		for (const feature of missing) {
			this.logger.warn(
				'router',
				`Your project uses ${feature}, but your custom src/fetch.ts does not call the ${feature}() handler. ` +
					`This feature will not work unless your fetch handler calls it.`,
			);
		}
	}

	getDefaultStatusCode(routeData: RouteData, pathname: string): number {
		return getDefaultStatusCode(this.manifest, routeData, pathname);
	}

	public getManifest() {
		return this.manifest;
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
