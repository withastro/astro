import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { I18nRouter, type I18nRouterContext } from '../../i18n/router.js';
import type { SSRManifest } from '../app/types.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER } from '../constants.js';

/**
 * Minimal context `I18n.finalize` needs from its caller. Packs the pieces
 * of `APIContext` that the i18n post-processing uses so the class doesn't
 * depend on a full `APIContext` (which belongs to the middleware layer).
 */
export interface I18nFinalizeContext {
	/**
	 * Called for redirect decisions. Must return a redirect `Response`.
	 * Typically builds a 302/301/307/308 with a `Location` header.
	 */
	redirect(location: string, status: number): Response;
	/**
	 * Called for fallback rewrite decisions. Must re-enter the render
	 * pipeline targeting the new pathname and resolve with the new
	 * `Response`. Mirrors the semantics of `Astro.rewrite(...)`.
	 */
	rewrite(pathname: string): Promise<Response>;
	/** The locale computed for this request, if any. */
	currentLocale: string | undefined;
	/** Whether the matched route is prerendered. */
	isPrerendered: boolean;
}

/**
 * Post-processes a rendered `Response` against the app's i18n
 * configuration. This is the logic that previously ran as the internal
 * `createI18nMiddleware` middleware — lifted out of the middleware layer
 * so it runs as an explicit step in `AstroHandler.render` after the
 * middleware chain returns.
 *
 * Public entry points in `astro:i18n` (`createMiddleware`) preserve the
 * middleware-shaped API by wrapping an `I18n` instance in a
 * `MiddlewareHandler` closure.
 */
export class I18n {
	#i18n: NonNullable<SSRManifest['i18n']>;
	#base: SSRManifest['base'];
	#trailingSlash: SSRManifest['trailingSlash'];
	#format: SSRManifest['buildFormat'];
	#router: I18nRouter;

	constructor(
		i18n: NonNullable<SSRManifest['i18n']>,
		base: SSRManifest['base'],
		trailingSlash: SSRManifest['trailingSlash'],
		format: SSRManifest['buildFormat'],
	) {
		this.#i18n = i18n;
		this.#base = base;
		this.#trailingSlash = trailingSlash;
		this.#format = format;
		this.#router = new I18nRouter({
			strategy: i18n.strategy,
			defaultLocale: i18n.defaultLocale,
			locales: i18n.locales,
			base,
			domains: i18n.domainLookupTable
				? Object.keys(i18n.domainLookupTable).reduce(
						(acc, domain) => {
							const locale = i18n.domainLookupTable[domain];
							if (!acc[domain]) {
								acc[domain] = [];
							}
							acc[domain].push(locale);
							return acc;
						},
						{} as Record<string, string[]>,
					)
				: undefined,
		});
	}

	async finalize(
		request: Request,
		response: Response,
		ctx: I18nFinalizeContext,
	): Promise<Response> {
		const i18n = this.#i18n;
		const typeHeader = response.headers.get(ROUTE_TYPE_HEADER);

		// This is a case where we are internally rendering a 404/500, so we
		// need to bypass checks that were done already.
		const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
		if (isReroute === 'no' && typeof i18n.fallback === 'undefined') {
			return response;
		}

		// If the route we're processing is not a page, then we ignore it
		if (typeHeader !== 'page' && typeHeader !== 'fallback') {
			return response;
		}

		const url = new URL(request.url);

		// Build context for router (typeHeader is guaranteed to be 'page' | 'fallback' here)
		const routerContext: I18nRouterContext = {
			currentLocale: ctx.currentLocale,
			currentDomain: url.hostname,
			routeType: typeHeader as 'page' | 'fallback',
			isReroute: isReroute === 'yes',
		};

		// Step 1: Apply routing strategy
		const routeDecision = this.#router.match(url.pathname, routerContext);

		switch (routeDecision.type) {
			case 'redirect': {
				// Apply trailing slash if needed
				let location = routeDecision.location;
				if (shouldAppendForwardSlash(this.#trailingSlash, this.#format)) {
					location = appendForwardSlash(location);
				}
				return ctx.redirect(location, routeDecision.status ?? 302);
			}
			case 'notFound': {
				if (ctx.isPrerendered) {
					// Prerendered pages are authored content — preserve the body so the
					// build pipeline can write the file. The REROUTE_DIRECTIVE prevents
					// the App from rerouting to the error page.
					const prerenderedRes = new Response(response.body, {
						status: 404,
						headers: response.headers,
					});
					prerenderedRes.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
					if (routeDecision.location) {
						prerenderedRes.headers.set('Location', routeDecision.location);
					}
					return prerenderedRes;
				}
				// For SSR, return a null-body 404 so the App reroutes to the actual
				// 404 page. This prevents dynamic routes like [locale] from serving
				// their content for invalid locale paths.
				const headers = new Headers();
				if (routeDecision.location) {
					headers.set('Location', routeDecision.location);
				}
				return new Response(null, { status: 404, headers });
			}
			case 'continue':
				break; // Continue to fallback check
		}

		// Step 2: Apply fallback logic (if configured)
		if (i18n.fallback && i18n.fallbackType) {
			const fallbackDecision = computeFallbackRoute({
				pathname: url.pathname,
				responseStatus: response.status,
				currentLocale: ctx.currentLocale,
				fallback: i18n.fallback,
				fallbackType: i18n.fallbackType,
				locales: i18n.locales,
				defaultLocale: i18n.defaultLocale,
				strategy: i18n.strategy,
				base: this.#base,
			});

			switch (fallbackDecision.type) {
				case 'redirect':
					return ctx.redirect(fallbackDecision.pathname + url.search, 302);
				case 'rewrite':
					return await ctx.rewrite(fallbackDecision.pathname + url.search);
				case 'none':
					break;
			}
		}

		return response;
	}
}
