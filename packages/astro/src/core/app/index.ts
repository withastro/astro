import {
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
} from '@astrojs/internal-helpers/path';
import { matchPattern, type RemotePattern } from '../../assets/utils/remotePattern.js';
import { normalizeTheLocale } from '../../i18n/index.js';
import type { RoutesList } from '../../types/astro.js';
import type { RouteData, SSRManifest } from '../../types/public/internal.js';
import {
	clientAddressSymbol,
	DEFAULT_404_COMPONENT,
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	responseSentSymbol,
} from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { consoleLogDestination } from '../logger/console.js';
import { AstroIntegrationLogger, Logger } from '../logger/core.js';
import { NOOP_MIDDLEWARE_FN } from '../middleware/noop-middleware.js';
import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '../path.js';
import { createAssetLink } from '../render/ssr-element.js';
import { RenderContext } from '../render-context.js';
import { redirectTemplate } from '../routing/3xx.js';
import { ensure404Route } from '../routing/astro-designed-error-pages.js';
import { createDefaultRoutes } from '../routing/default.js';
import { matchRoute } from '../routing/match.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session.js';
import { AppPipeline } from './pipeline.js';

export { deserializeManifest } from './common.js';

type ErrorPagePath =
	| `${string}/404`
	| `${string}/500`
	| `${string}/404/`
	| `${string}/500/`
	| `${string}404.html`
	| `${string}500.html`;

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
	 * If not provided, Astro will fallback to its default behavior for fetching error pages.
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
	 * **Advanced API**: you probably do not need to use this.
	 *
	 * Default: `app.match(request)`
	 */
	routeData?: RouteData;
}

export interface RenderErrorOptions {
	locals?: App.Locals;
	routeData?: RouteData;
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
	clientAddress: string | undefined;
	prerenderedErrorPageFetch: (url: ErrorPagePath) => Promise<Response>;
}

export class App {
	#manifest: SSRManifest;
	#manifestData: RoutesList;
	#logger = new Logger({
		dest: consoleLogDestination,
		level: 'info',
	});
	#baseWithoutTrailingSlash: string;
	#pipeline: AppPipeline;
	#adapterLogger: AstroIntegrationLogger;

	constructor(manifest: SSRManifest, streaming = true) {
		this.#manifest = manifest;
		this.#manifestData = {
			routes: manifest.routes.map((route) => route.routeData),
		};
		// This is necessary to allow running middlewares for 404 in SSR. There's special handling
		// to return the host 404 if the user doesn't provide a custom 404
		ensure404Route(this.#manifestData);
		this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#manifest.base);
		this.#pipeline = this.#createPipeline(streaming);
		this.#adapterLogger = new AstroIntegrationLogger(
			this.#logger.options,
			this.#manifest.adapterName,
		);
	}

	getAdapterLogger(): AstroIntegrationLogger {
		return this.#adapterLogger;
	}

	getAllowedDomains() {
		return this.#manifest.allowedDomains;
	}

	protected get manifest(): SSRManifest {
		return this.#manifest;
	}

	protected set manifest(value: SSRManifest) {
		this.#manifest = value;
	}

	protected matchesAllowedDomains(forwardedHost: string, protocol?: string): boolean {
		return App.validateForwardedHost(forwardedHost, this.#manifest.allowedDomains, protocol);
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
	 * @private
	 */
	#createPipeline(streaming = false) {
		return AppPipeline.create({
			logger: this.#logger,
			manifest: this.#manifest,
			runtimeMode: 'production',
			renderers: this.#manifest.renderers,
			defaultRoutes: createDefaultRoutes(this.#manifest),
			resolve: async (specifier: string) => {
				if (!(specifier in this.#manifest.entryModules)) {
					throw new Error(`Unable to resolve [${specifier}]`);
				}
				const bundlePath = this.#manifest.entryModules[specifier];
				if (bundlePath.startsWith('data:') || bundlePath.length === 0) {
					return bundlePath;
				} else {
					return createAssetLink(bundlePath, this.#manifest.base, this.#manifest.assetsPrefix);
				}
			},
			serverLike: true,
			streaming,
		});
	}

	set setManifestData(newManifestData: RoutesList) {
		this.#manifestData = newManifestData;
	}

	removeBase(pathname: string) {
		if (pathname.startsWith(this.#manifest.base)) {
			return pathname.slice(this.#baseWithoutTrailingSlash.length + 1);
		}
		return pathname;
	}

	/**
	 * It removes the base from the request URL, prepends it with a forward slash and attempts to decoded it.
	 *
	 * If the decoding fails, it logs the error and return the pathname as is.
	 * @param request
	 * @private
	 */
	#getPathnameFromRequest(request: Request): string {
		const url = new URL(request.url);
		const pathname = prependForwardSlash(this.removeBase(url.pathname));
		try {
			return decodeURI(pathname);
		} catch (e: any) {
			this.getAdapterLogger().error(e.toString());
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
	match(request: Request, allowPrerenderedRoutes = false): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.#manifest.assets.has(url.pathname)) return undefined;
		let pathname = this.#computePathnameFromDomain(request);
		if (!pathname) {
			pathname = prependForwardSlash(this.removeBase(url.pathname));
		}
		let routeData = matchRoute(decodeURI(pathname), this.#manifestData);

		if (!routeData) return undefined;
		if (allowPrerenderedRoutes) {
			return routeData;
		}
		// missing routes fall-through, pre rendered are handled by static layer
		else if (routeData.prerender) {
			return undefined;
		}
		return routeData;
	}

	#computePathnameFromDomain(request: Request): string | undefined {
		let pathname: string | undefined = undefined;
		const url = new URL(request.url);

		if (
			this.#manifest.i18n &&
			(this.#manifest.i18n.strategy === 'domains-prefix-always' ||
				this.#manifest.i18n.strategy === 'domains-prefix-other-locales' ||
				this.#manifest.i18n.strategy === 'domains-prefix-always-no-redirect')
		) {
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host
			let forwardedHost = request.headers.get('X-Forwarded-Host');
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
			let protocol = request.headers.get('X-Forwarded-Proto');
			if (protocol) {
				// this header doesn't have a colon at the end, so we add to be in line with URL#protocol, which does have it
				protocol = protocol + ':';
			} else {
				// we fall back to the protocol of the request
				protocol = url.protocol;
			}

			// Validate X-Forwarded-Host against allowedDomains if configured
			if (forwardedHost && !this.matchesAllowedDomains(forwardedHost, protocol?.replace(':', ''))) {
				// If not allowed, ignore the X-Forwarded-Host header
				forwardedHost = null;
			}

			let host = forwardedHost;
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
						this.#manifest.i18n.domainLookupTable,
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
						if (url.pathname.endsWith('/')) {
							pathname = appendForwardSlash(pathname);
						}
					}
				} catch (e: any) {
					this.#logger.error(
						'router',
						`Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`,
					);
					this.#logger.error('router', `Error: ${e}`);
				}
			}
		}
		return pathname;
	}

	#redirectTrailingSlash(pathname: string): string {
		const { trailingSlash } = this.#manifest;

		// Ignore root and internal paths
		if (pathname === '/' || isInternalPath(pathname)) {
			return pathname;
		}

		// Redirect multiple trailing slashes to collapsed path
		const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== 'never');
		if (path !== pathname) {
			return path;
		}

		if (trailingSlash === 'ignore') {
			return pathname;
		}

		if (trailingSlash === 'always' && !hasFileExtension(pathname)) {
			return appendForwardSlash(pathname);
		}
		if (trailingSlash === 'never') {
			return removeTrailingForwardSlash(pathname);
		}

		return pathname;
	}

	async render(request: Request, renderOptions?: RenderOptions): Promise<Response> {
		let routeData: RouteData | undefined;
		let locals: object | undefined;
		let clientAddress: string | undefined;
		let addCookieHeader: boolean | undefined;
		const url = new URL(request.url);
		const redirect = this.#redirectTrailingSlash(url.pathname);
		const prerenderedErrorPageFetch = renderOptions?.prerenderedErrorPageFetch ?? fetch;

		if (redirect !== url.pathname) {
			const status = request.method === 'GET' ? 301 : 308;
			return new Response(
				redirectTemplate({
					status,
					relativeLocation: url.pathname,
					absoluteLocation: redirect,
					from: request.url,
				}),
				{
					status,
					headers: {
						location: redirect + url.search,
					},
				},
			);
		}

		addCookieHeader = renderOptions?.addCookieHeader;
		clientAddress = renderOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol);
		routeData = renderOptions?.routeData;
		locals = renderOptions?.locals;

		if (routeData) {
			this.#logger.debug(
				'router',
				'The adapter ' + this.#manifest.adapterName + ' provided a custom RouteData for ',
				request.url,
			);
			this.#logger.debug('router', 'RouteData:\n' + routeData);
		}
		if (locals) {
			if (typeof locals !== 'object') {
				const error = new AstroError(AstroErrorData.LocalsNotAnObject);
				this.#logger.error(null, error.stack!);
				return this.#renderError(request, {
					status: 500,
					error,
					clientAddress,
					prerenderedErrorPageFetch: prerenderedErrorPageFetch,
				});
			}
		}
		if (!routeData) {
			routeData = this.match(request);
			this.#logger.debug('router', 'Astro matched the following route for ' + request.url);
			this.#logger.debug('router', 'RouteData:\n' + routeData);
		}
		// At this point we haven't found a route that matches the request, so we create
		// a "fake" 404 route, so we can call the RenderContext.render
		// and hit the middleware, which might be able to return a correct Response.
		if (!routeData) {
			routeData = this.#manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}
		if (!routeData) {
			this.#logger.debug('router', "Astro hasn't found routes that match " + request.url);
			this.#logger.debug('router', "Here's the available routes:\n", this.#manifestData);
			return this.#renderError(request, {
				locals,
				status: 404,
				clientAddress,
				prerenderedErrorPageFetch: prerenderedErrorPageFetch,
			});
		}
		const pathname = this.#getPathnameFromRequest(request);
		const defaultStatus = this.#getDefaultStatusCode(routeData, pathname);

		let response;
		let session: AstroSession | undefined;
		try {
			// Load route module. We also catch its error here if it fails on initialization
			const mod = await this.#pipeline.getModuleForRoute(routeData);

			const renderContext = await RenderContext.create({
				pipeline: this.#pipeline,
				locals,
				pathname,
				request,
				routeData,
				status: defaultStatus,
				clientAddress,
			});
			session = renderContext.session;
			response = await renderContext.render(await mod.page());
		} catch (err: any) {
			this.#logger.error(null, err.stack || err.message || String(err));
			return this.#renderError(request, {
				locals,
				status: 500,
				error: err,
				clientAddress,
				prerenderedErrorPageFetch: prerenderedErrorPageFetch,
			});
		} finally {
			await session?.[PERSIST_SYMBOL]();
		}

		if (
			REROUTABLE_STATUS_CODES.includes(response.status) &&
			response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			return this.#renderError(request, {
				locals,
				response,
				status: response.status as 404 | 500,
				// We don't have an error to report here. Passing null means we pass nothing intentionally
				// while undefined means there's no error
				error: response.status === 500 ? null : undefined,
				clientAddress,
				prerenderedErrorPageFetch: prerenderedErrorPageFetch,
			});
		}

		// We remove internally-used header before we send the response to the user agent.
		if (response.headers.has(REROUTE_DIRECTIVE_HEADER)) {
			response.headers.delete(REROUTE_DIRECTIVE_HEADER);
		}

		if (addCookieHeader) {
			for (const setCookieHeaderValue of App.getSetCookieFromResponse(response)) {
				response.headers.append('set-cookie', setCookieHeaderValue);
			}
		}

		Reflect.set(response, responseSentSymbol, true);
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
	 * This also handles pre-rendered /404 or /500 routes
	 */
	async #renderError(
		request: Request,
		{
			locals,
			status,
			response: originalResponse,
			skipMiddleware = false,
			error,
			clientAddress,
			prerenderedErrorPageFetch,
		}: RenderErrorOptions,
	): Promise<Response> {
		const errorRoutePath = `/${status}${this.#manifest.trailingSlash === 'always' ? '/' : ''}`;
		const errorRouteData = matchRoute(errorRoutePath, this.#manifestData);
		const url = new URL(request.url);
		if (errorRouteData) {
			if (errorRouteData.prerender) {
				const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? '.html' : '';
				const statusURL = new URL(
					`${this.#baseWithoutTrailingSlash}/${status}${maybeDotHtml}`,
					url,
				);
				if (statusURL.toString() !== request.url) {
					const response = await prerenderedErrorPageFetch(statusURL.toString() as ErrorPagePath);

					// In order for the response of the remote to be usable as a response
					// for this request, it needs to have our status code in the response
					// instead of the likely successful 200 code it returned when fetching
					// the error page.
					//
					// Furthermore, remote may have returned a compressed page
					// (the Content-Encoding header was set to e.g. `gzip`). The fetch
					// implementation in the `mergeResponses` method will make a decoded
					// response available, so Content-Length and Content-Encoding will
					// not match the body we provide and need to be removed.
					const override = { status, removeContentEncodingHeaders: true };

					return this.#mergeResponses(response, originalResponse, override);
				}
			}
			const mod = await this.#pipeline.getModuleForRoute(errorRouteData);
			let session: AstroSession | undefined;
			try {
				const renderContext = await RenderContext.create({
					locals,
					pipeline: this.#pipeline,
					middleware: skipMiddleware ? NOOP_MIDDLEWARE_FN : undefined,
					pathname: this.#getPathnameFromRequest(request),
					request,
					routeData: errorRouteData,
					status,
					props: { error },
					clientAddress,
				});
				session = renderContext.session;
				const response = await renderContext.render(await mod.page());
				return this.#mergeResponses(response, originalResponse);
			} catch {
				// Middleware may be the cause of the error, so we try rendering 404/500.astro without it.
				if (skipMiddleware === false) {
					return this.#renderError(request, {
						locals,
						status,
						response: originalResponse,
						skipMiddleware: true,
						clientAddress,
						prerenderedErrorPageFetch,
					});
				}
			} finally {
				await session?.[PERSIST_SYMBOL]();
			}
		}

		const response = this.#mergeResponses(new Response(null, { status }), originalResponse);
		Reflect.set(response, responseSentSymbol, true);
		return response;
	}

	#mergeResponses(
		newResponse: Response,
		originalResponse?: Response,
		override?: {
			status: 404 | 500;
			removeContentEncodingHeaders: boolean;
		},
	) {
		let newResponseHeaders = newResponse.headers;

		// In order to set the body of a remote response as the new response body, we need to remove
		// headers about encoding in transit, as Node's standard fetch implementation `undici`
		// currently does not do so.
		//
		// Also see https://github.com/nodejs/undici/issues/2514
		if (override?.removeContentEncodingHeaders) {
			// The original headers are immutable, so we need to clone them here.
			newResponseHeaders = new Headers(newResponseHeaders);

			newResponseHeaders.delete('Content-Encoding');
			newResponseHeaders.delete('Content-Length');
		}

		if (!originalResponse) {
			if (override !== undefined) {
				return new Response(newResponse.body, {
					status: override.status,
					statusText: newResponse.statusText,
					headers: newResponseHeaders,
				});
			}
			return newResponse;
		}

		// If the new response did not have a meaningful status, an override may have been provided
		// If the original status was 200 (default), override it with the new status (probably 404 or 500)
		// Otherwise, the user set a specific status while rendering and we should respect that one
		const status = override?.status
			? override.status
			: originalResponse.status === 200
				? newResponse.status
				: originalResponse.status;

		try {
			// this function could throw an error...
			originalResponse.headers.delete('Content-type');
		} catch {}
		// we use a map to remove duplicates
		const mergedHeaders = new Map([
			...Array.from(newResponseHeaders),
			...Array.from(originalResponse.headers),
		]);
		const newHeaders = new Headers();
		for (const [name, value] of mergedHeaders) {
			newHeaders.set(name, value);
		}
		return new Response(newResponse.body, {
			status,
			statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
			// If you're looking at here for possible bugs, it means that it's not a bug.
			// With the middleware, users can meddle with headers, and we should pass to the 404/500.
			// If users see something weird, it's because they are setting some headers they should not.
			//
			// Although, we don't want it to replace the content-type, because the error page must return `text/html`
			headers: newHeaders,
		});
	}

	#getDefaultStatusCode(routeData: RouteData, pathname: string): number {
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
}
