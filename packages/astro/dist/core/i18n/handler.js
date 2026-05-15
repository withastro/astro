import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { I18nRouter } from '../../i18n/router.js';
import { PipelineFeatures } from '../base-pipeline.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER } from '../constants.js';
class I18n {
	#i18n;
	#base;
	#trailingSlash;
	#format;
	#router;
	constructor(i18n, base, trailingSlash, format) {
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
				? Object.keys(i18n.domainLookupTable).reduce((acc, domain) => {
						const locale = i18n.domainLookupTable[domain];
						if (!acc[domain]) {
							acc[domain] = [];
						}
						acc[domain].push(locale);
						return acc;
					}, {})
				: void 0,
		});
	}
	async finalize(state, response) {
		state.pipeline.usedFeatures |= PipelineFeatures.i18n;
		const i18n = this.#i18n;
		const typeHeader = response.headers.get(ROUTE_TYPE_HEADER);
		const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
		if (isReroute === 'no' && typeof i18n.fallback === 'undefined') {
			return response;
		}
		if (typeHeader !== 'page' && typeHeader !== 'fallback') {
			return response;
		}
		const url = new URL(state.request.url);
		const currentLocale = state.computeCurrentLocale();
		const isPrerendered = state.routeData.prerender;
		const routerContext = {
			currentLocale,
			currentDomain: url.hostname,
			routeType: typeHeader,
			isReroute: isReroute === 'yes',
		};
		const routeDecision = this.#router.match(url.pathname, routerContext);
		switch (routeDecision.type) {
			case 'redirect': {
				let location = routeDecision.location;
				if (shouldAppendForwardSlash(this.#trailingSlash, this.#format)) {
					location = appendForwardSlash(location);
				}
				return new Response(null, {
					status: routeDecision.status ?? 302,
					headers: { Location: location },
				});
			}
			case 'notFound': {
				if (isPrerendered) {
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
				const headers = new Headers();
				if (routeDecision.location) {
					headers.set('Location', routeDecision.location);
				}
				return new Response(null, { status: 404, headers });
			}
			case 'continue':
				break;
		}
		if (i18n.fallback && i18n.fallbackType) {
			const effectiveStatus = typeHeader === 'fallback' ? 404 : response.status;
			const fallbackDecision = computeFallbackRoute({
				pathname: url.pathname,
				responseStatus: effectiveStatus,
				currentLocale,
				fallback: i18n.fallback,
				fallbackType: i18n.fallbackType,
				locales: i18n.locales,
				defaultLocale: i18n.defaultLocale,
				strategy: i18n.strategy,
				base: this.#base,
			});
			switch (fallbackDecision.type) {
				case 'redirect':
					return new Response(null, {
						status: 302,
						headers: { Location: fallbackDecision.pathname + url.search },
					});
				case 'rewrite':
					return await state.rewrite(fallbackDecision.pathname + url.search);
				case 'none':
					break;
			}
		}
		return response;
	}
}
export { I18n };
