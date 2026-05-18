import {
	appendForwardSlash,
	collapseDuplicateLeadingSlashes,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { matchPattern } from '@astrojs/internal-helpers/remote';
import { normalizeTheLocale } from '../../i18n/index.js';
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
		if (!this.#adapterLogger) {
			this.#adapterLogger = new AstroIntegrationLogger(
				this.logger.options,
				this.manifest.adapterName,
			);
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
	 * Extracts the base-stripped, decoded pathname from a request.
	 * Used by adapters to compute the pathname for dev-mode route matching.
	 */
	public getPathnameFromRequest(request: Request): string {
		const url = new URL(request.url);
		const pathname = prependForwardSlash(this.removeBase(url.pathname));
		try {
			return decodeURI(pathname);
		} catch (e: any) {
			this.adapterLogger.error(e.toString());
			return pathname;
		}
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
		const routeData = this.pipeline.matchRoute(decodeURI(pathname));
		if (!routeData) return undefined;
		if (allowPrerenderedRoutes) {
			return routeData;
		}
		// missing routes fall-through, pre rendered are handled by static layer
		if (routeData.prerender) {
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
		let pathname: string | undefined = undefined;
		const url = new URL(request.url);

		if (
			this.manifest.i18n &&
			(this.manifest.i18n.strategy === 'domains-prefix-always' ||
				this.manifest.i18n.strategy === 'domains-prefix-other-locales' ||
				this.manifest.i18n.strategy === 'domains-prefix-always-no-redirect')
		) {
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host
			let host = request.headers.get('X-Forwarded-Host');
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
			let protocol = request.headers.get('X-Forwarded-Proto');
			if (protocol) {
				// this header doesn't have a colon at the end, so we add to be in line with URL#protocol, which does have it
				protocol = protocol + ':';
			} else {
				// we fall back to the protocol of the request
				protocol = url.protocol;
			}
			if (!host) {
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host
				host = request.headers.get('Host');
			}
			// If we don't have a host and a protocol, it's impossible to proceed
			if (host && protocol) {
				// The header might have a port in their name, so we remove it
				host = host.split(':')[0];
				try {
					let locale;
					const hostAsUrl = new URL(`${protocol}//${host}`);
					for (const [domainKey, localeValue] of Object.entries(
						this.manifest.i18n.domainLookupTable,
					)) {
						// This operation should be safe because we force the protocol via zod inside the configuration
						// If not, then it means that the manifest was tampered
						const domainKeyAsUrl = new URL(domainKey);

						if (
							hostAsUrl.host === domainKeyAsUrl.host &&
							hostAsUrl.protocol === domainKeyAsUrl.protocol
						) {
							locale = localeValue;
							break;
						}
					}

					if (locale) {
						pathname = prependForwardSlash(
							joinPaths(normalizeTheLocale(locale), this.removeBase(url.pathname)),
						);
						if (this.manifest.trailingSlash === 'always') {
							pathname = appendForwardSlash(pathname);
						} else if (this.manifest.trailingSlash === 'never') {
							pathname = removeTrailingForwardSlash(pathname);
						} else if (url.pathname.endsWith('/')) {
							// trailingSlash === 'ignore': preserve the original trailing slash
							pathname = appendForwardSlash(pathname);
						}
					}
				} catch (e: any) {
					this.logger.error(
						'router',
						`Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`,
					);
					this.logger.error('router', `Error: ${e}`);
				}
			}
		}
		return pathname;
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
		// For domain-based i18n, compute the locale-prefixed pathname from
		// the Host header and pass it so FetchState can match correctly.
		if (!routeData) {
			const domainPathname = this.computePathnameFromDomain(request);
			if (domainPathname) {
				routeData = this.pipeline.matchRoute(decodeURI(domainPathname));
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
