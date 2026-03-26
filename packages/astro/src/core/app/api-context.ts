import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../../i18n/utils.js';
import type { ActionAPIContext } from '../../actions/runtime/types.js';
import { ACTION_RPC_ROUTE_PATTERN } from '../../actions/consts.js';
import { ASTRO_GENERATOR, pipelineSymbol } from '../constants.js';
import { AstroCookies } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { Pipeline } from '../base-pipeline.js';
import { AstroCache, type CacheLike } from '../cache/runtime/cache.js';
import { DisabledAstroCache, NoopAstroCache } from '../cache/runtime/noop.js';
import { AstroSession } from '../session/runtime.js';
import { getOriginPathname } from '../routing/rewrite.js';

const contextCache = new WeakMap<Request, ActionAPIContext>();

export interface GetAPIContextOptions {
	locals?: object;
	clientAddress?: string;
	routePattern?: string;
}

export async function getAPIContext(
	request: Request,
	pipeline: Pipeline,
	{
		locals = {},
		clientAddress,
		routePattern = ACTION_RPC_ROUTE_PATTERN,
	}: GetAPIContextOptions = {},
): Promise<ActionAPIContext> {
	const cached = contextCache.get(request);
	if (cached) return cached;

	const url = new URL(request.url);
	const cookies = new AstroCookies(request);

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
	}

	const { i18n } = pipeline;

	const context: ActionAPIContext = {
		get cookies() {
			return cookies;
		},
		routePattern,
		isPrerendered: false,
		get clientAddress() {
			if (clientAddress) return clientAddress;
			if (pipeline.adapterName) {
				throw new AstroError({
					...AstroErrorData.ClientAddressNotAvailable,
					message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
				});
			}
			throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
		},
		get currentLocale() {
			if (!i18n) return undefined;
			return computeCurrentLocale(url.pathname, i18n.locales, i18n.defaultLocale);
		},
		generator: ASTRO_GENERATOR,
		get locals() {
			return locals as App.Locals;
		},
		set locals(_) {
			throw new AstroError(AstroErrorData.LocalsReassigned);
		},
		params: {},
		get preferredLocale() {
			if (!i18n) return undefined;
			return computePreferredLocale(request, i18n.locales);
		},
		get preferredLocaleList() {
			if (!i18n) return undefined;
			return computePreferredLocaleList(request, i18n.locales);
		},
		request,
		site: pipeline.site,
		url,
		get originPathname() {
			return getOriginPathname(request);
		},
		get session() {
			if (!session) {
				pipeline.logger.warn(
					'session',
					`context.session was used for an action request, but no storage configuration was provided.`,
				);
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
					pipeline.logger.warn(
						'csp',
						`context.csp was used for an action request, but CSP was not configured.`,
					);
				}
				return undefined;
			}
			// CSP directives are not applicable outside of page rendering
			return undefined;
		},
	};

	Reflect.set(context, pipelineSymbol, pipeline);
	contextCache.set(request, context);
	return context;
}
