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
import type { Pipeline } from '../base-pipeline.js';
import { getSetCookiesFromResponse } from '../cookies/response.js';
import { consoleLogDestination } from '../logger/console.js';
import { AstroIntegrationLogger, AstroLogger } from '../logger/core.js';
import { type CreateRenderContext, RenderContext } from '../render-context.js';
import { ensure404Route } from '../routing/astro-designed-error-pages.js';
import { Router } from '../routing/router.js';
import type { AppPipeline } from './pipeline.js';
import { renderOptionsStore } from './render-options-store.js';
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
	 * **Advanced API**: you probably do not need to use this.
	 *
	 * Default: `app.match(request)`
	 */
	routeData?: RouteData;
}

type RequiredRenderOptions = Required<RenderOptions>;

interface ResolvedRenderOptions {
	addCookieHeader: RequiredRenderOptions['addCookieHeader'];
	clientAddress: RequiredRenderOptions['clientAddress'] | undefined;
	prerenderedErrorPageFetch: RequiredRenderOptions['prerenderedErrorPageFetch'] | undefined;
	locals: RequiredRenderOptions['locals'] | undefined;
	routeData: RequiredRenderOptions['routeData'] | undefined;
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
	manifestData: RoutesList;
	pipeline: P;
	adapterLogger: AstroIntegrationLogger;
	baseWithoutTrailingSlash: string;
	logger: AstroLogger;
	#router: Router;
	#userApp: { fetch: (request: Request) => Response | Promise<Response> } | undefined;
	constructor(manifest: SSRManifest, streaming = true, ...args: any[]) {
		this.manifest = manifest;
		this.manifestData = { routes: manifest.routes.map((route) => route.routeData) };
		this.baseWithoutTrailingSlash = removeTrailingForwardSlash(manifest.base);
		this.pipeline = this.createPipeline(streaming, manifest, ...args);
		this.logger = new AstroLogger({
			destination: consoleLogDestination,
			level: manifest.logLevel,
		});
		this.adapterLogger = new AstroIntegrationLogger(this.logger.options, manifest.adapterName);
		// This is necessary to allow running middlewares for 404 in SSR. There's special handling
		// to return the host 404 if the user doesn't provide a custom 404
		ensure404Route(this.manifestData);
		this.#router = this.createRouter(this.manifestData);
	}

	public abstract isDev(): boolean;

	setUserApp(userApp: { fetch: (request: Request) => Response | Promise<Response> }): void {
		this.#userApp = userApp;
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		return RenderContext.create(payload);
	}

	getAdapterLogger(): AstroIntegrationLogger {
		return this.adapterLogger;
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
		this.#router = this.createRouter(this.manifestData);
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
	 * It removes the base from the request URL, prepends it with a forward slash and attempts to decoded it.
	 *
	 * If the decoding fails, it logs the error and return the pathname as is.
	 * @param request
	 */
	public getPathnameFromRequest(request: Request): string {
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
	public match(request: Request, allowPrerenderedRoutes = false): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.manifest.assets.has(url.pathname)) return undefined;
		let pathname = this.computePathnameFromDomain(request);
		if (!pathname) {
			pathname = prependForwardSlash(this.removeBase(url.pathname));
		}
		const match = this.#router.match(decodeURI(pathname), { allowWithoutBase: true });
		if (match.type !== 'match') return undefined;
		const routeData = match.route;
		if (allowPrerenderedRoutes) {
			return routeData;
		}
		// missing routes fall-through, pre rendered are handled by static layer
		else if (routeData.prerender) {
			return undefined;
		}
		return routeData;
	}

	private createRouter(manifestData: RoutesList): Router {
		return new Router(manifestData.routes, {
			base: this.manifest.base,
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
		});
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
						if (url.pathname.endsWith('/')) {
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

	public async render(request: Request, options: RenderOptions = {}): Promise<Response> {
		if (!this.#userApp) {
			// Auto-create a default Hono app using the shared factory.
			const { createAstroApp } = await import('./hono-app.js');
			this.#userApp = createAstroApp({
				pipeline: this.pipeline,
				manifest: this.manifest,
				manifestData: this.manifestData,
				logger: this.logger,
			});
		}
		// Pass per-request render options into the Hono pipeline via AsyncLocalStorage.
		// This avoids smuggling values on the Request object (which breaks when
		// Requests are cloned for rewrites).
		const userApp = this.#userApp;
		return renderOptionsStore.run(
			{
				locals: options.locals,
				clientAddress: options.clientAddress,
				addCookieHeader: options.addCookieHeader,
			},
			() => userApp.fetch(request),
		);
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
