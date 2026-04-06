import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import {
	clientAddressSymbol,
	DEFAULT_404_COMPONENT,
	NOOP_MIDDLEWARE_HEADER,
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	responseSentSymbol,
	REWRITE_DIRECTIVE_HEADER_KEY,
	ROUTE_TYPE_HEADER,
} from '../constants.js';
import {
	AstroCookies,
	attachCookiesToResponse,
	getSetCookiesFromResponse,
} from '../cookies/index.js';
import { getCookiesFromResponse } from '../cookies/response.js';
import { AstroError, AstroErrorData, isAstroError } from '../errors/index.js';
import { NoMatchingStaticPathFound } from '../errors/errors-data.js';
import { consoleLogDestination } from '../logger/console.js';
import { Logger } from '../logger/core.js';
import { type CreateRenderContext, RenderContext } from '../render-context.js';
import { redirectTemplate } from '../routing/3xx.js';
import { ensure404Route } from '../routing/astro-designed-error-pages.js';
import { routeHasHtmlExtension } from '../routing/helpers.js';
import { matchRoute } from '../routing/match.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { Router } from '../routing/router.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import type { RoutesList } from '../../types/astro.js';
import type { RouteData, SSRManifest } from '../../types/public/index.js';
import type { Pipeline } from '../base-pipeline.js';
import { AppPipeline } from './pipeline.js';

export interface RenderOptions {
	addCookieHeader?: boolean;
	clientAddress?: string;
	locals?: object;
	prerenderedErrorPageFetch?: (url: string) => Promise<Response>;
	routeData?: RouteData;
}

interface ResolvedRenderOptions {
	addCookieHeader: boolean;
	clientAddress: string | undefined;
	prerenderedErrorPageFetch: ((url: string) => Promise<Response>) | undefined;
	locals: object | undefined;
	routeData: RouteData | undefined;
}

export interface RenderErrorOptions extends ResolvedRenderOptions {
	response?: Response;
	status: 404 | 500;
	skipMiddleware?: boolean;
	error?: unknown;
}

export class Pages {
	manifest: SSRManifest;
	manifestData: RoutesList;
	pipeline: Pipeline;
	logger: Logger;
	#router: Router;
	#getRoutes: (() => RoutesList) | undefined;
	#lastRoutes: RouteData[] | undefined;
	#isDev: boolean;

	constructor(manifest: SSRManifest, pipeline?: Pipeline, routeSource?: { manifestData: RoutesList }) {
		this.manifest = manifest;
		this.manifestData = { routes: manifest.routes.map((route) => route.routeData) };
		this.logger = new Logger({
			dest: consoleLogDestination,
			level: manifest.logLevel,
		});
		this.#isDev = !!routeSource;
		if (routeSource) {
			// In dev, routes are loaded dynamically. Use a getter that reads from
			// the source (e.g. DevApp) so we always have the latest routes.
			this.#getRoutes = () => routeSource.manifestData;
		}
		ensure404Route(this.manifestData);
		this.pipeline = pipeline ?? AppPipeline.create({ manifest, streaming: true });
		this.#router = this.#createRouter(this.manifestData);
	}

	updateRoutes(newRoutesList: RoutesList): void {
		this.manifestData = newRoutesList;
		ensure404Route(this.manifestData);
		this.#router = this.#createRouter(this.manifestData);
	}

	#syncRoutes(): void {
		if (!this.#getRoutes) return;
		const current = this.#getRoutes();
		if (current.routes !== this.#lastRoutes) {
			this.#lastRoutes = current.routes;
			this.manifestData = current;
			ensure404Route(this.manifestData);
			this.#router = this.#createRouter(this.manifestData);
		}
	}

	#createRouter(manifestData: RoutesList): Router {
		return new Router(manifestData.routes, {
			base: this.manifest.base,
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
		});
	}

	public match(request: Request, { allowPrerenderedRoutes = false } = {}): RouteData | undefined {
		this.#syncRoutes();
		const url = new URL(request.url);
		if (this.manifest.assets.has(url.pathname)) return undefined;
		const pathname = decodeURI(url.pathname);
		const match = this.#router.match(pathname);
		if (match.type === 'match') {
			if (!allowPrerenderedRoutes && match.route.prerender) return undefined;
			return match.route;
		}
		// In dev, try matching without .html extensions or index.html suffixes
		// to handle URLs like /page/index.html → /page/
		if (this.#isDev) {
			const altPathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
			if (altPathname !== pathname) {
				const altMatch = this.#router.match(altPathname);
				if (altMatch.type === 'match') {
					if (!allowPrerenderedRoutes && altMatch.route.prerender) return undefined;
					return altMatch.route;
				}
			}
			// When trailingSlash is 'never' and the base is not '/', the index route pattern
			// is ^$ (matches empty string). The Router prepends '/' internally, so a direct
			// pattern match is needed for this edge case.
			const testPathname = altPathname !== pathname ? altPathname : pathname;
			if (testPathname === '/' && this.manifest.trailingSlash === 'never') {
				const route = this.manifestData.routes.find((r) => r.pattern.test(''));
				if (route) {
					if (!allowPrerenderedRoutes && route.prerender) return undefined;
					return route;
				}
			}
		}
		return undefined;
	}

	public async render(request: Request, options: RenderOptions = {}): Promise<Response> {
		this.#syncRoutes();
		const {
			addCookieHeader = false,
			clientAddress = Reflect.get(request, clientAddressSymbol) as string | undefined,
			locals,
			prerenderedErrorPageFetch = fetch,
			routeData: routeDataOption,
		} = options;

		const timeStart = performance.now();
		const url = new URL(request.url);
		const redirect = this.#redirectTrailingSlash(url.pathname);

		if (redirect !== url.pathname) {
			const status = request.method === 'GET' ? 301 : 308;
			const response = new Response(
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
			this.#prepareResponse(response, { addCookieHeader });
			return response;
		}

		const resolvedRenderOptions: ResolvedRenderOptions = {
			addCookieHeader,
			clientAddress,
			prerenderedErrorPageFetch,
			locals,
			routeData: routeDataOption,
		};

		if (locals && typeof locals !== 'object') {
			const error = new AstroError(AstroErrorData.LocalsNotAnObject);
			this.logger.error(null, error.stack!);
			return this.renderError(request, {
				...resolvedRenderOptions,
				locals: undefined,
				status: 500,
				error,
			});
		}

		let routeData = routeDataOption;
		if (!routeData) {
			routeData = this.match(request, { allowPrerenderedRoutes: true });
			this.logger.debug('router', 'Astro matched the following route for ' + request.url);
			this.logger.debug('router', 'RouteData:\n' + routeData);
		}

		if (!routeData) {
			routeData = this.manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}

		if (!routeData) {
			this.logger.debug('router', "Astro hasn't found routes that match " + request.url);
			this.logger.debug('router', "Here's the available routes:\n", this.manifestData);
			return this.renderError(request, {
				...resolvedRenderOptions,
				status: 404,
			});
		}

		// For prerendered routes, strip query params from the request URL
		// so that Astro.request.url doesn't expose them in static output.
		if (routeData.prerender && url.search) {
			url.search = '';
			request = new Request(url, request);
		}

		let pathname = this.#getPathnameFromRequest(request);
		if (!routeHasHtmlExtension(routeData)) {
			pathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}

		const defaultStatus = this.#getDefaultStatusCode(routeData, pathname);

		let response: Response;
		let session: AstroSession | undefined;
		let cache: CacheLike | undefined;
		try {
			const componentInstance = await this.pipeline.getComponentByRoute(routeData);
			const renderContext = await RenderContext.create({
				pipeline: this.pipeline,
				locals,
				pathname,
				request,
				routeData,
				status: defaultStatus,
				clientAddress,
			} as CreateRenderContext);
			session = renderContext.session;
			cache = renderContext.cache;

			if (this.pipeline.cacheProvider) {
				const cacheProvider = await this.pipeline.getCacheProvider();
				if (cacheProvider?.onRequest) {
					response = await cacheProvider.onRequest(
						{ request, url: new URL(request.url) },
						async () => {
							const res = await renderContext.render(componentInstance);
							applyCacheHeaders(cache!, res);
							return res;
						},
					);
					response.headers.delete('CDN-Cache-Control');
					response.headers.delete('Cache-Tag');
				} else {
					response = await renderContext.render(componentInstance);
					applyCacheHeaders(cache!, response);
				}
			} else {
				response = await renderContext.render(componentInstance);
			}

			const isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);
			const timeEnd = performance.now();
			this.logger.debug('router', `Rendered ${pathname} in ${timeEnd - timeStart}ms`);
			void isRewrite;
		} catch (err: any) {
			// A getStaticPaths route matched the pattern but the specific params
			// aren't in the static paths list. Treat this as a 404, not a 500.
			if (isAstroError(err) && err.title === NoMatchingStaticPathFound.title) {
				this.logger.warn('router', err.message);
				return this.renderError(request, {
					...resolvedRenderOptions,
					status: 404,
					error: err,
				});
			}
			this.logger.error(null, err.stack || err.message || String(err));
			// In dev, try to render the custom 500 page if one exists.
			// If no custom 500 page, re-throw so the error reaches the Vite error overlay.
			// In production, always render the error page (falls back to empty 500 response).
			if (this.#isDev) {
				const errorRoutePath = `/500${this.manifest.trailingSlash === 'always' ? '/' : ''}`;
				const custom500 = matchRoute(errorRoutePath, this.manifestData);
				if (!custom500) throw err;
			}
			return this.renderError(request, {
				...resolvedRenderOptions,
				status: 500,
				error: err,
			});
		} finally {
			await session?.[PERSIST_SYMBOL]();
		}

		if (
			REROUTABLE_STATUS_CODES.includes(response.status) &&
			response.body === null &&
			response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			return this.renderError(request, {
				...resolvedRenderOptions,
				response,
				status: response.status as 404 | 500,
				error: response.status === 500 ? null : undefined,
			});
		}

		this.#prepareResponse(response, { addCookieHeader });
		return response;
	}

	public async renderError(
		request: Request,
		{
			status,
			response: originalResponse,
			skipMiddleware = false,
			error,
			...resolvedRenderOptions
		}: RenderErrorOptions,
	): Promise<Response> {
		const errorRoutePath = `/${status}${this.manifest.trailingSlash === 'always' ? '/' : ''}`;
		const errorRouteData = matchRoute(errorRoutePath, this.manifestData);
		const url = new URL(request.url);
		if (errorRouteData) {
			// In production, prerendered error pages are fetched as static assets.
			// In dev, always render the component directly so that Astro.url
			// reflects the originally-requested path, not /404.html.
			if (errorRouteData.prerender && !this.#isDev) {
				const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? '.html' : '';
				const statusURL = new URL(
					`${removeTrailingForwardSlash(this.manifest.base)}/${status}${maybeDotHtml}`,
					url,
				);
				if (
					statusURL.toString() !== request.url &&
					resolvedRenderOptions.prerenderedErrorPageFetch
				) {
					const response = await resolvedRenderOptions.prerenderedErrorPageFetch(
						statusURL.toString(),
					);
					const override = { status, removeContentEncodingHeaders: true };
					const newResponse = this.#mergeResponses(response, originalResponse, override);
					this.#prepareResponse(newResponse, resolvedRenderOptions);
					return newResponse;
				}
			}
			const mod = await this.pipeline.getComponentByRoute(errorRouteData);
			let session: AstroSession | undefined;
			try {
				const renderContext = await RenderContext.create({
					locals: resolvedRenderOptions.locals,
					pipeline: this.pipeline,
					skipMiddleware,
					pathname: this.#getPathnameFromRequest(request),
					request,
					routeData: errorRouteData,
					status,
					props: { error },
					clientAddress: resolvedRenderOptions.clientAddress,
				} as CreateRenderContext);
				session = renderContext.session;
				const response = await renderContext.render(mod);
				const newResponse = this.#mergeResponses(response, originalResponse);
				this.#prepareResponse(newResponse, resolvedRenderOptions);
				return newResponse;
			} catch {
				if (skipMiddleware === false) {
					return this.renderError(request, {
						...resolvedRenderOptions,
						status,
						response: originalResponse,
						skipMiddleware: true,
					});
				}
			} finally {
				await session?.[PERSIST_SYMBOL]();
			}
		}

		const response = this.#mergeResponses(new Response(null, { status }), originalResponse);
		this.#prepareResponse(response, resolvedRenderOptions);
		return response;
	}

	#redirectTrailingSlash(pathname: string): string {
		const { trailingSlash } = this.manifest;

		if (pathname === '/' || isInternalPath(pathname)) {
			return pathname;
		}

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

	#getPathnameFromRequest(request: Request): string {
		const url = new URL(request.url);
		const base = removeTrailingForwardSlash(this.manifest.base);
		const pathname = prependForwardSlash(
			base.length > 0 ? url.pathname.slice(base.length) : url.pathname,
		);
		try {
			return decodeURI(pathname);
		} catch {
			return pathname;
		}
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

	#prepareResponse(response: Response, { addCookieHeader }: { addCookieHeader: boolean }): void {
		for (const headerName of [
			REROUTE_DIRECTIVE_HEADER,
			REWRITE_DIRECTIVE_HEADER_KEY,
			NOOP_MIDDLEWARE_HEADER,
			ROUTE_TYPE_HEADER,
		]) {
			if (response.headers.has(headerName)) {
				response.headers.delete(headerName);
			}
		}

		if (addCookieHeader) {
			for (const setCookieHeaderValue of getSetCookiesFromResponse(response)) {
				response.headers.append('set-cookie', setCookieHeaderValue);
			}
		}

		Reflect.set(response, responseSentSymbol, true);
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

		if (override?.removeContentEncodingHeaders) {
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

		const status = override?.status
			? override.status
			: originalResponse.status === 200
				? newResponse.status
				: originalResponse.status;

		try {
			originalResponse.headers.delete('Content-type');
			originalResponse.headers.delete('Content-Length');
			originalResponse.headers.delete('Transfer-Encoding');
		} catch {
			// Headers may be immutable
		}

		const newHeaders = new Headers();
		const seen = new Set<string>();
		for (const [name, value] of originalResponse.headers) {
			newHeaders.append(name, value);
			seen.add(name.toLowerCase());
		}
		for (const [name, value] of newResponseHeaders) {
			if (!seen.has(name.toLowerCase())) {
				newHeaders.append(name, value);
			}
		}

		const mergedResponse = new Response(newResponse.body, {
			status,
			statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
			headers: newHeaders,
		});

		const originalCookies = getCookiesFromResponse(originalResponse);
		const newCookies = getCookiesFromResponse(newResponse);
		if (originalCookies) {
			if (newCookies) {
				for (const cookieValue of AstroCookies.consume(newCookies)) {
					originalResponse.headers.append('set-cookie', cookieValue);
				}
			}
			attachCookiesToResponse(mergedResponse, originalCookies);
		} else if (newCookies) {
			attachCookiesToResponse(mergedResponse, newCookies);
		}

		return mergedResponse;
	}
}
