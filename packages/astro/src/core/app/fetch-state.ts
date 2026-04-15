import {
	collapseDuplicateSlashes,
	removeBase,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/index.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../../i18n/utils.js';
import {
	ASTRO_GENERATOR,
	clientAddressSymbol,
	clientLocalsSymbol,
	pipelineSymbol,
} from '../constants.js';
import {
	ACTION_API_CONTEXT_SYMBOL,
} from '../../actions/runtime/server.js';
import { AstroCookies } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroSession } from '../session/runtime.js';
import { AstroCache, type CacheLike } from '../cache/runtime/cache.js';
import { compileCacheRoutes, matchCacheRoute } from '../cache/runtime/route-matching.js';
import { DisabledAstroCache, NoopAstroCache } from '../cache/runtime/noop.js';
import { getParams } from '../render/params-and-props.js';
import { getOriginPathname } from '../routing/rewrite.js';
import { validateAndDecodePathname } from '../util/pathname.js';
import { getRenderOptions, copyRenderOptions } from './render-options-store.js';
import { prepareForRender } from './prepare.js';
import type { Pipeline } from '../base-pipeline.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';

function resolveDomainLocale(request: Request, pipeline: Pipeline): string | undefined {
	const i18n = pipeline.i18n;
	if (
		!i18n ||
		(i18n.strategy !== 'domains-prefix-always' &&
			i18n.strategy !== 'domains-prefix-other-locales')
	) {
		return undefined;
	}
	const domainLookupTable = i18n.domainLookupTable;
	if (!domainLookupTable) return undefined;
	const url = new URL(request.url);
	const hostname = url.hostname;
	const locale = domainLookupTable[hostname];
	if (locale) return normalizeTheLocale(locale);
	return undefined;
}

/**
 * Mutable per-request state shared across the middleware pipeline.
 *
 * This is the framework-agnostic state bag that individual handlers
 * (redirects, rewrites, i18n, etc.) read and write to during a request.
 * In the Hono app it lives on the Hono context, but core modules only
 * depend on this class — not on Hono.
 */
export class FetchState {
	/** The original request for this fetch. */
	readonly request: Request;

	/** The pipeline for this app. */
	readonly pipeline: Pipeline;

	/** The matched route for this request, if any. */
	routeData: RouteData | undefined;

	/** Set by i18n/user code to request a rewrite to a different pathname. */
	rewritePathname: string | undefined;

	/** Tracks how many rewrites have occurred to detect loops. */
	rewriteCount: number = 0;

	/** Cached APIContext instance. */
	#apiContext: APIContext | undefined;

	constructor(request: Request, pipeline: Pipeline) {
		this.request = request;
		this.pipeline = pipeline;
	}

	/**
	 * Returns the APIContext for this request, creating it lazily on first call.
	 * The context is cached so subsequent calls return the same instance.
	 */
	async getAPIContext(): Promise<APIContext> {
		if (this.#apiContext) return this.#apiContext;

		const { request, pipeline } = this;
		const manifest = pipeline.manifest;
		const url = new URL(request.url);

		// Normalize the URL pathname to prevent security bypass attacks.
		try {
			url.pathname = validateAndDecodePathname(url.pathname);
		} catch {
			try {
				url.pathname = decodeURI(url.pathname);
			} catch {
				// If even basic decoding fails, leave pathname as-is.
			}
		}
		url.pathname = collapseDuplicateSlashes(url.pathname);

		const i18nConfig = pipeline.i18n;

		const cookies = new AstroCookies(request);
		const storeOptions = getRenderOptions(request);
		const requestClientAddress = storeOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined;

		const pipelineSessionDriver = await pipeline.getSessionDriver();
		const session =
			pipeline.manifest.sessionConfig && pipelineSessionDriver
				? new AstroSession({
						cookies,
						config: pipeline.manifest.sessionConfig,
						runtimeMode: pipeline.runtimeMode,
						driverFactory: pipelineSessionDriver,
						mockStorage: null,
					})
				: undefined;

		let cache: CacheLike;
		if (!pipeline.cacheConfig) {
			cache = new DisabledAstroCache(pipeline.logger);
		} else if (pipeline.runtimeMode === 'development') {
			cache = new NoopAstroCache();
		} else {
			const cacheProvider = await pipeline.getCacheProvider();
			cache = new AstroCache(cacheProvider);

			if (pipeline.cacheConfig?.routes) {
				if (!pipeline.compiledCacheRoutes) {
					pipeline.compiledCacheRoutes = compileCacheRoutes(
						pipeline.cacheConfig.routes,
						manifest.base,
						manifest.trailingSlash,
					);
				}
				const pathname = removeBase(decodeURI(url.pathname), manifest.base) || '/';
				const matched = matchCacheRoute(pathname, pipeline.compiledCacheRoutes);
				if (matched) {
					cache.set(matched);
				}
			}
		}

		const locals: App.Locals = storeOptions?.locals ?? (Reflect.get(request, clientLocalsSymbol) as App.Locals) ?? ({} as App.Locals);
		let _paramsOverride: Record<string, string | undefined> | undefined;
		let _routePatternOverride: string | undefined;

		// Capture `this` (the FetchState) for use in APIContext getters.
		// biome-ignore lint/correctness/noUnusedVariables: used in ctx closures below
		const state = this;

		const ctx: APIContext = {
			get cookies() {
				return cookies;
			},
			request,
			url,
			site: pipeline.site,
			generator: ASTRO_GENERATOR,
			props: {} as any,
			get params() {
				if (_paramsOverride) return _paramsOverride;
				const { routeData } = state;
				if (!routeData) return {};
				const pathname = removeBase(decodeURI(url.pathname), manifest.base) || '/';
				return getParams(routeData, pathname);
			},
			set params(value) {
				_paramsOverride = value;
			},
			get routePattern() {
				return _routePatternOverride ?? state.routeData?.route ?? '';
			},
			set routePattern(value) {
				_routePatternOverride = value;
			},
			get isPrerendered() {
				return state.routeData?.prerender ?? false;
			},
			locals,
			get clientAddress() {
				if (requestClientAddress) return requestClientAddress;
				if (pipeline.adapterName) {
					throw new AstroError({
						...AstroErrorData.ClientAddressNotAvailable,
						message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
					});
				}
				throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
			},
			get currentLocale() {
				if (!i18nConfig) return undefined;
				const domainLocale = resolveDomainLocale(request, pipeline);
				if (domainLocale) return domainLocale;
				return computeCurrentLocale(url.pathname, i18nConfig.locales, i18nConfig.defaultLocale);
			},
			get preferredLocale() {
				if (!i18nConfig) return undefined;
				return computePreferredLocale(request, i18nConfig.locales);
			},
			get preferredLocaleList() {
				if (!i18nConfig) return undefined;
				return computePreferredLocaleList(request, i18nConfig.locales);
			},
			get originPathname() {
				return getOriginPathname(request);
			},
			get session() {
				if (!session) {
					pipeline.logger.warn('session', `context.session was used but no storage configuration was provided.`);
					return undefined;
				}
				return session;
			},
			get cache() {
				return cache;
			},
			get csp() {
				if (!pipeline.manifest.csp) {
					if (pipeline.runtimeMode === 'production') {
						pipeline.logger.warn('csp', `context.csp was used but CSP was not configured.`);
					}
					return undefined;
				}
				return undefined;
			},
			redirect(path: string, status = 302) {
				return new Response(null, { status, headers: { Location: path } });
			},
			async rewrite(rewritePayload) {
				const { routeData, pathname: rewritePathname, newUrl } = await pipeline.tryRewrite(rewritePayload, request);
				// Forbid SSR → prerendered rewrites in server mode
				const sourceRouteData = state.routeData;
				if (
					pipeline.manifest.serverLike === true &&
					sourceRouteData && !sourceRouteData.prerender &&
					routeData.prerender === true
				) {
					throw new AstroError({
						...ForbiddenRewrite,
						message: ForbiddenRewrite.message(url.pathname, rewritePathname, routeData.component),
						hint: ForbiddenRewrite.hint(routeData.component),
					});
				}
				if (request.bodyUsed) {
					throw new AstroError(AstroErrorData.RewriteWithBodyUsed);
				}
				const newRequest = rewritePayload instanceof Request
					? rewritePayload
					: new Request(newUrl, request);
				copyRenderOptions(request, newRequest);
				for (const setCookieValue of cookies.headers()) {
					newRequest.headers.append('cookie', setCookieValue.split(';')[0]);
				}
				return prepareForRender(pipeline, manifest, pipeline.manifestData, pipeline.logger, newRequest, routeData, {
					locals,
					clientAddress: storeOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
					cookies,
					session,
					isDev: pipeline.runtimeMode === 'development',
				}, (renderContext, componentInstance) => renderContext.render(componentInstance));
			},
			getActionResult(_action) {
				return undefined;
			},
			async callAction(action, input) {
				const handler = (action as any).bind(ctx);
				return handler(input);
			},
		};

		Reflect.set(ctx, pipelineSymbol, pipeline);
		Reflect.set(ctx, ACTION_API_CONTEXT_SYMBOL, true);
		this.#apiContext = ctx;
		return ctx;
	}
}
