import {
	appendForwardSlash,
	collapseDuplicateLeadingSlashes,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { matchPattern } from '@astrojs/internal-helpers/remote';
import { normalizeTheLocale } from '../../i18n/index.js';
import { PipelineFeatures } from '../base-pipeline.js';
import { ASTRO_ERROR_HEADER, clientAddressSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { AstroIntegrationLogger } from '../logger/core.js';
import { DefaultFetchHandler } from '../fetch/default-handler.js';
import { appSymbol } from '../constants.js';
import { DefaultErrorHandler } from '../errors/default-handler.js';
import { setRenderOptions } from './render-options.js';
import { MultiLevelEncodingError } from '../util/pathname.js';
class BaseApp {
	manifest;
	manifestData;
	pipeline;
	#adapterLogger;
	baseWithoutTrailingSlash;
	/**
	 * The handler that turns incoming `Request` objects into `Response`s.
	 * Defaults to a `DefaultFetchHandler` pinned to this app and can be
	 * overridden via `setFetchHandler` — typically by the bundled
	 * entrypoint after importing `virtual:astro:fetchable`.
	 */
	#fetchHandler;
	#errorHandler;
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
	get logger() {
		return this.pipeline.logger;
	}
	get adapterLogger() {
		if (!this.#adapterLogger) {
			this.#adapterLogger = new AstroIntegrationLogger(
				this.logger.options,
				this.manifest.adapterName,
			);
		}
		return this.#adapterLogger;
	}
	constructor(manifest, streaming = true, ...args) {
		this.manifest = manifest;
		this.baseWithoutTrailingSlash = removeTrailingForwardSlash(manifest.base);
		this.pipeline = this.createPipeline(streaming, manifest, ...args);
		this.manifestData = this.pipeline.manifestData;
		this.#fetchHandler = new DefaultFetchHandler(this);
		this.#errorHandler = this.createErrorHandler();
	}
	/**
	 * Override the fetch handler used to dispatch requests. Entrypoints
	 * call this with the default export of `virtual:astro:fetchable` to
	 * plug in a user-authored handler from `src/app.ts`.
	 */
	setFetchHandler(handler) {
		this.#fetchHandler = handler;
		this.#hasCustomFetchHandler = !(handler instanceof DefaultFetchHandler);
	}
	/**
	 * Returns the error handler strategy used by this app. Override to
	 * provide environment-specific behavior (dev overlay, build-time throws, etc.).
	 */
	createErrorHandler() {
		return new DefaultErrorHandler(this);
	}
	/**
	 * Resets the cached adapter logger so it picks up a new logger instance.
	 * Used by BuildApp when the logger is replaced via setOptions().
	 */
	resetAdapterLogger() {
		this.#adapterLogger = void 0;
	}
	getAllowedDomains() {
		return this.manifest.allowedDomains;
	}
	matchesAllowedDomains(forwardedHost, protocol) {
		return BaseApp.validateForwardedHost(forwardedHost, this.manifest.allowedDomains, protocol);
	}
	static validateForwardedHost(forwardedHost, allowedDomains, protocol) {
		if (!allowedDomains || allowedDomains.length === 0) {
			return false;
		}
		try {
			const testUrl = new URL(`${protocol || 'https'}://${forwardedHost}`);
			return allowedDomains.some((pattern) => {
				return matchPattern(testUrl, pattern);
			});
		} catch {
			return false;
		}
	}
	set setManifestData(newManifestData) {
		this.manifestData = newManifestData;
		this.pipeline.manifestData = newManifestData;
		this.pipeline.rebuildRouter();
	}
	removeBase(pathname) {
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
	getPathnameFromRequest(request) {
		const url = new URL(request.url);
		const pathname = prependForwardSlash(this.removeBase(url.pathname));
		try {
			return decodeURI(pathname);
		} catch (e) {
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
	match(request, allowPrerenderedRoutes = false) {
		const url = new URL(request.url);
		if (this.manifest.assets.has(url.pathname)) return void 0;
		let pathname = this.computePathnameFromDomain(request);
		if (!pathname) {
			pathname = prependForwardSlash(this.removeBase(url.pathname));
		}
		const routeData = this.pipeline.matchRoute(decodeURI(pathname));
		if (!routeData) return void 0;
		if (allowPrerenderedRoutes) {
			return routeData;
		}
		if (routeData.prerender) {
			return void 0;
		}
		return routeData;
	}
	/**
	 * A matching route function to use in the development server.
	 * Contrary to the `.match` function, this function resolves props and params, returning the correct
	 * route based on the priority, segments. It also returns the correct, resolved pathname.
	 * @param pathname
	 */
	devMatch(pathname) {
		pathname;
		return void 0;
	}
	computePathnameFromDomain(request) {
		let pathname = void 0;
		const url = new URL(request.url);
		if (
			this.manifest.i18n &&
			(this.manifest.i18n.strategy === 'domains-prefix-always' ||
				this.manifest.i18n.strategy === 'domains-prefix-other-locales' ||
				this.manifest.i18n.strategy === 'domains-prefix-always-no-redirect')
		) {
			let host = request.headers.get('X-Forwarded-Host');
			let protocol = request.headers.get('X-Forwarded-Proto');
			if (protocol) {
				protocol = protocol + ':';
			} else {
				protocol = url.protocol;
			}
			if (!host) {
				host = request.headers.get('Host');
			}
			if (host && protocol) {
				host = host.split(':')[0];
				try {
					let locale;
					const hostAsUrl = new URL(`${protocol}//${host}`);
					for (const [domainKey, localeValue] of Object.entries(
						this.manifest.i18n.domainLookupTable,
					)) {
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
							pathname = appendForwardSlash(pathname);
						}
					}
				} catch (e) {
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
	async render(
		request,
		{
			addCookieHeader = false,
			clientAddress = Reflect.get(request, clientAddressSymbol),
			locals,
			prerenderedErrorPageFetch = fetch,
			routeData,
			waitUntil,
		} = {},
	) {
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
				this.logger.error(null, error.stack);
				return this.renderError(request, {
					addCookieHeader,
					clientAddress,
					prerenderedErrorPageFetch,
					// If locals are invalid, we don't want to include them when
					// rendering the error page
					locals: void 0,
					routeData,
					waitUntil,
					status: 500,
					error,
				});
			}
		}
		if (!routeData) {
			const domainPathname = this.computePathnameFromDomain(request);
			if (domainPathname) {
				routeData = this.pipeline.matchRoute(decodeURI(domainPathname));
			}
		}
		const resolvedOptions = {
			addCookieHeader,
			clientAddress,
			prerenderedErrorPageFetch,
			locals,
			routeData,
			waitUntil,
		};
		let response;
		try {
			if (this.#fetchHandler instanceof DefaultFetchHandler) {
				Reflect.set(request, appSymbol, this);
				response = await this.#fetchHandler.renderWithOptions(request, resolvedOptions);
			} else {
				setRenderOptions(request, resolvedOptions);
				Reflect.set(request, appSymbol, this);
				response = await this.#fetchHandler.fetch(request);
			}
		} catch (err) {
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
				status: response.status,
				error: response.status === 500 ? null : void 0,
			});
		}
		return response;
	}
	setCookieHeaders(response) {
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
	async renderError(request, options) {
		return this.#errorHandler.renderError(request, options);
	}
	/**
	 * One-shot check: after the first request with a custom `src/app.ts`,
	 * compare `usedFeatures` against the manifest and warn about any
	 * configured features the user's pipeline doesn't call.
	 */
	#warnMissingFeatures() {
		if (this.#featureCheckDone || !this.#hasCustomFetchHandler) return;
		this.#featureCheckDone = true;
		const manifest = this.manifest;
		const missing = [];
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
				`Your project uses ${feature}, but your custom src/app.ts does not call the ${feature}() handler. This feature will not work unless you add it to your app.ts pipeline.`,
			);
		}
	}
	getDefaultStatusCode(routeData, pathname) {
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
	getManifest() {
		return this.pipeline.manifest;
	}
	logThisRequest({ pathname, method, statusCode, isRewrite, timeStart }) {
		const timeEnd = performance.now();
		this.logRequest({
			pathname,
			method,
			statusCode,
			isRewrite,
			reqTime: timeEnd - timeStart,
		});
	}
}
export { BaseApp };
