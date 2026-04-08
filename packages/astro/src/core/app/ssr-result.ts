/**
 * Creates the SSRResult object used by renderPage().
 *
 * Extracted from RenderContext so that renderers can create SSRResult
 * without depending on the full RenderContext class.
 */
import colors from 'piccolore';
import { deserializeActionResult } from '../../actions/runtime/client.js';
import { createCallAction, createGetActionResult, hasActionPayload } from '../../actions/utils.js';
import type { AstroGlobal } from '../../types/public/context.js';
import type { RouteData, SSRResult } from '../../types/public/internal.js';
import type { ComponentInstance } from '../../types/astro.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { generateCspDigest } from '../encryption.js';
import { pushDirective } from '../csp/runtime.js';
import type { Pipeline } from '../base-pipeline.js';
import { AstroCookies } from '../cookies/index.js';
import { ASTRO_GENERATOR, responseSentSymbol } from '../constants.js';
import { getOriginPathname } from '../routing/rewrite.js';
import { Slots } from '../render/index.js';
import type { AstroSession } from '../session/runtime.js';
import type { CacheLike } from '../cache/runtime/cache.js';
import type { RewritePayload } from '../../types/public/common.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../../i18n/utils.js';


export interface CreateSSRResultOptions {
	pipeline: Pipeline;
	routeData: RouteData;
	mod: ComponentInstance;
	request: Request;
	pathname: string;
	params: Record<string, string | undefined>;
	status: number;
	locals: object;
	cookies: AstroCookies;
	url: URL;
	clientAddress: string | undefined;
	session: AstroSession | undefined;
	cache: CacheLike | undefined;
	shouldInjectCspMetaTags: boolean;
	serverIslandNameMap: Map<string, string>;
	partial: boolean | undefined;
	rewrite: (payload: RewritePayload) => Promise<Response>;
}

export async function createSSRResult(options: CreateSSRResultOptions): Promise<SSRResult> {
	const {
		pipeline,
		routeData,
		mod,
		request,
		pathname,
		params,
		status,
		locals,
		cookies,
		url,
		clientAddress,
		session,
		cache,
		shouldInjectCspMetaTags,
		serverIslandNameMap,
		partial: partialOverride,
		rewrite,
	} = options;

	const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } = pipeline;
	const { links, scripts, styles } = await pipeline.headElements(routeData);

	const extraStyleHashes: string[] = [];
	const extraScriptHashes: string[] = [];
	const cspAlgorithm = manifest.csp?.algorithm ?? 'SHA-256';
	if (shouldInjectCspMetaTags) {
		for (const style of styles) {
			extraStyleHashes.push(await generateCspDigest(style.children, cspAlgorithm));
		}
		for (const script of scripts) {
			extraScriptHashes.push(await generateCspDigest(script.children, cspAlgorithm));
		}
	}

	const componentMetadata =
		(await pipeline.componentMetadata(routeData)) ?? manifest.componentMetadata;
	const headers = new Headers({ 'Content-Type': 'text/html' });
	const partial = typeof partialOverride === 'boolean' ? partialOverride : Boolean(mod.partial);
	const actionResult = hasActionPayload(locals)
		? deserializeActionResult((locals as any)._actionPayload.actionResult)
		: undefined;
	const response = {
		status: actionResult?.error ? actionResult?.error.status : status,
		statusText: actionResult?.error ? actionResult?.error.type : 'OK',
		get headers() {
			return headers;
		},
		set headers(_: any) {
			throw new AstroError(AstroErrorData.AstroResponseHeadersReassigned);
		},
	} satisfies AstroGlobal['response'];

	// Context passed to createAstroGlobal for each component instantiation.
	const astroCtx: AstroGlobalContext = {
		pipeline, routeData, request, params, locals, cookies,
		url, clientAddress, session, cache, rewrite,
	};

	const result: SSRResult = {
		base: manifest.base,
		userAssetsBase: manifest.userAssetsBase,
		cancelled: false,
		clientDirectives,
		inlinedScripts,
		componentMetadata,
		compressHTML,
		cookies,
		createAstro: (props: Record<string, any>, slots: Record<string, any> | null) =>
			createAstroGlobal(result, props, slots, astroCtx),
		links,
		params,
		partial,
		pathname,
		renderers,
		resolve,
		response,
		request,
		scripts,
		styles,
		actionResult,
		serverIslandNameMap,
		key: manifest.key,
		trailingSlash: manifest.trailingSlash,
		_experimentalQueuedRendering: {
			pool: pipeline.nodePool,
			htmlStringCache: pipeline.htmlStringCache,
			enabled: manifest.experimentalQueuedRendering?.enabled,
			poolSize: manifest.experimentalQueuedRendering?.poolSize,
			contentCache: manifest.experimentalQueuedRendering?.contentCache,
		},
		_metadata: {
			hasHydrationScript: false,
			rendererSpecificHydrationScripts: new Set(),
			hasRenderedHead: false,
			renderedScripts: new Set(),
			hasDirectives: new Set(),
			hasRenderedServerIslandRuntime: false,
			headInTree: false,
			extraHead: [],
			extraStyleHashes,
			extraScriptHashes,
			propagators: new Set(),
		},
		cspDestination: manifest.csp?.cspDestination ?? (routeData.prerender ? 'meta' : 'header'),
		shouldInjectCspMetaTags,
		cspAlgorithm,
		scriptHashes: manifest.csp?.scriptHashes ? [...manifest.csp.scriptHashes] : [],
		scriptResources: manifest.csp?.scriptResources ? [...manifest.csp.scriptResources] : [],
		styleHashes: manifest.csp?.styleHashes ? [...manifest.csp.styleHashes] : [],
		styleResources: manifest.csp?.styleResources ? [...manifest.csp.styleResources] : [],
		directives: manifest.csp?.directives ? [...manifest.csp.directives] : [],
		isStrictDynamic: manifest.csp?.isStrictDynamic ?? false,
		internalFetchHeaders: manifest.internalFetchHeaders,
	};

	return result;
}

// ---------------------------------------------------------------------------
// Astro global factory
// ---------------------------------------------------------------------------

interface AstroGlobalContext {
	pipeline: Pipeline;
	routeData: RouteData;
	request: Request;
	params: Record<string, string | undefined>;
	locals: object;
	cookies: AstroCookies;
	url: URL;
	clientAddress: string | undefined;
	session: AstroSession | undefined;
	cache: CacheLike | undefined;
	rewrite: (payload: RewritePayload) => Promise<Response>;
}

function createAstroGlobal(
	result: SSRResult,
	props: Record<string, any>,
	slotValues: Record<string, any> | null,
	ctx: AstroGlobalContext,
): AstroGlobal {
	const { pipeline, routeData, request, params, locals, cookies, url, clientAddress, session, cache, rewrite } = ctx;
	const { manifest } = pipeline;
	const i18nConfig = manifest.i18n;

	const redirect = (path: string, status = 302) => {
		if ((request as any)[responseSentSymbol]) {
			throw new AstroError({ ...AstroErrorData.ResponseSentError });
		}
		return new Response(null, { status, headers: { Location: path } });
	};

	const callAction = createCallAction({
		locals,
		cookies,
		request,
		url,
		redirect,
		rewrite,
	} as any);

	const pagePartial: Omit<AstroGlobal, 'props' | 'self' | 'slots'> = {
		generator: ASTRO_GENERATOR,
		routePattern: routeData.route,
		isPrerendered: routeData.prerender,
		cookies,
		get session() {
			if (this.isPrerendered) {
				pipeline.logger.warn(
					'session',
					`Astro.session was used when rendering the route ${colors.green(this.routePattern)}, but it is not available on prerendered pages.`,
				);
				return undefined;
			}
			if (!session) {
				pipeline.logger.warn(
					'session',
					`Astro.session was used when rendering the route ${colors.green(this.routePattern)}, but no storage configuration was provided.`,
				);
				return undefined;
			}
			return session;
		},
		get cache() {
			return cache!;
		},
		get clientAddress() {
			if (routeData.prerender) {
				throw new AstroError({
					...AstroErrorData.PrerenderClientAddressNotAvailable,
					message: AstroErrorData.PrerenderClientAddressNotAvailable.message(routeData.component),
				});
			}
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
			if (!i18nConfig) return undefined;
			// For domain-based i18n, resolve locale from the request domain
			if (
				i18nConfig.strategy === 'domains-prefix-always' ||
				i18nConfig.strategy === 'domains-prefix-other-locales' ||
				i18nConfig.strategy === 'domains-prefix-always-no-redirect'
			) {
				let host = request.headers.get('X-Forwarded-Host');
				let protocol = request.headers.get('X-Forwarded-Proto');
				if (protocol) protocol += ':';
				else protocol = url.protocol;
				if (!host) host = request.headers.get('Host');
				if (host && protocol) {
					host = host.split(':')[0];
					try {
						const hostAsUrl = new URL(`${protocol}//${host}`);
						for (const [domainKey, localeValue] of Object.entries(i18nConfig.domainLookupTable)) {
							const domainKeyAsUrl = new URL(domainKey);
							if (hostAsUrl.host === domainKeyAsUrl.host && hostAsUrl.protocol === domainKeyAsUrl.protocol) {
								return localeValue;
							}
						}
					} catch { /* invalid URL */ }
				}
			}
			return computeCurrentLocale(url.pathname, i18nConfig.locales, i18nConfig.defaultLocale);
		},
		params,
		get preferredLocale() {
			if (!i18nConfig) return undefined;
			return computePreferredLocale(request, i18nConfig.locales);
		},
		get preferredLocaleList() {
			if (!i18nConfig) return undefined;
			return computePreferredLocaleList(request, i18nConfig.locales);
		},
		locals,
		redirect,
		rewrite,
		request,
		response: result.response,
		site: pipeline.site,
		getActionResult: createGetActionResult(locals),
		get callAction() {
			return callAction;
		},
		url,
		get originPathname() {
			return getOriginPathname(request);
		},
		get csp(): any {
			if (!manifest.csp) {
				if (pipeline.runtimeMode === 'production') {
					pipeline.logger.warn('csp', `Astro.csp was used but CSP was not configured.`);
				}
				return undefined;
			}
			return {
				insertDirective(payload: any) {
					if (result.directives) {
						result.directives = pushDirective(result.directives, payload);
					}
				},
				insertScriptResource(resource: string) {
					result.scriptResources.push(resource);
				},
				insertStyleResource(resource: string) {
					result.styleResources.push(resource);
				},
				insertStyleHash(hash: string) {
					result.styleHashes.push(hash);
				},
				insertScriptHash(hash: string) {
					result.scriptHashes.push(hash);
				},
			};
		},
	};

	const Astro: Omit<AstroGlobal, 'self' | 'slots'> = Object.assign(
		Object.create(pagePartial),
		{ props, self: null },
	);

	let _slots: AstroGlobal['slots'];
	Object.defineProperty(Astro, 'slots', {
		get: () => {
			if (!_slots) {
				_slots = new Slots(
					result,
					slotValues,
					pipeline.logger,
				) as unknown as AstroGlobal['slots'];
			}
			return _slots;
		},
	});

	return Astro as AstroGlobal;
}
