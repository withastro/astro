import type { RoutesList } from '../../types/astro.js';
import type { AstroConfig } from '../../types/public/index.js';
import { decodeKey } from '../encryption.js';
import { NOOP_MIDDLEWARE_FN } from '../middleware/noop-middleware.js';
import { deserializeRouteData } from './manifest.js';
import type { RouteInfo, SerializedSSRManifest, SSRManifest } from './types.js';

export function deserializeManifest(
	serializedManifest: SerializedSSRManifest,
	routesList?: RoutesList,
): SSRManifest {
	const routes: RouteInfo[] = [];
	if (serializedManifest.routes) {
		for (const serializedRoute of serializedManifest.routes) {
			routes.push({
				...serializedRoute,
				routeData: deserializeRouteData(serializedRoute.routeData),
			});

			const route = serializedRoute as unknown as RouteInfo;
			route.routeData = deserializeRouteData(serializedRoute.routeData);
		}
	}
	if (routesList) {
		for (const route of routesList?.routes) {
			routes.push({
				file: '',
				links: [],
				scripts: [],
				styles: [],
				routeData: route,
			});
		}
	}
	const assets = new Set<string>(serializedManifest.assets);
	const componentMetadata = new Map(serializedManifest.componentMetadata);
	const inlinedScripts = new Map(serializedManifest.inlinedScripts);
	const clientDirectives = new Map(serializedManifest.clientDirectives);
	const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
	const key = decodeKey(serializedManifest.key);

	return {
		// in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
		middleware() {
			return { onRequest: NOOP_MIDDLEWARE_FN };
		},
		...serializedManifest,
		assets,
		componentMetadata,
		inlinedScripts,
		clientDirectives,
		routes,
		serverIslandNameMap,
		key,
	};
}

export type RoutingStrategies =
	| 'manual'
	| 'pathname-prefix-always'
	| 'pathname-prefix-other-locales'
	| 'pathname-prefix-always-no-redirect'
	| 'domains-prefix-always'
	| 'domains-prefix-other-locales'
	| 'domains-prefix-always-no-redirect';
export function toRoutingStrategy(
	routing: NonNullable<AstroConfig['i18n']>['routing'],
	domains: NonNullable<AstroConfig['i18n']>['domains'],
): RoutingStrategies {
	let strategy: RoutingStrategies;
	const hasDomains = domains ? Object.keys(domains).length > 0 : false;
	if (routing === 'manual') {
		strategy = 'manual';
	} else {
		if (!hasDomains) {
			if (routing?.prefixDefaultLocale === true) {
				if (routing.redirectToDefaultLocale) {
					strategy = 'pathname-prefix-always';
				} else {
					strategy = 'pathname-prefix-always-no-redirect';
				}
			} else {
				strategy = 'pathname-prefix-other-locales';
			}
		} else {
			if (routing?.prefixDefaultLocale === true) {
				if (routing.redirectToDefaultLocale) {
					strategy = 'domains-prefix-always';
				} else {
					strategy = 'domains-prefix-always-no-redirect';
				}
			} else {
				strategy = 'domains-prefix-other-locales';
			}
		}
	}

	return strategy;
}
export function toFallbackType(
	routing: NonNullable<AstroConfig['i18n']>['routing'],
): 'redirect' | 'rewrite' {
	if (routing === 'manual') {
		return 'rewrite';
	}
	return routing.fallbackType;
}

const PREFIX_DEFAULT_LOCALE = new Set([
	'pathname-prefix-always',
	'domains-prefix-always',
	'pathname-prefix-always-no-redirect',
	'domains-prefix-always-no-redirect',
]);

const REDIRECT_TO_DEFAULT_LOCALE = new Set([
	'pathname-prefix-always-no-redirect',
	'domains-prefix-always-no-redirect',
]);

export function fromRoutingStrategy(
	strategy: RoutingStrategies,
	fallbackType: NonNullable<SSRManifest['i18n']>['fallbackType'],
): NonNullable<AstroConfig['i18n']>['routing'] {
	let routing: NonNullable<AstroConfig['i18n']>['routing'];
	if (strategy === 'manual') {
		routing = 'manual';
	} else {
		routing = {
			prefixDefaultLocale: PREFIX_DEFAULT_LOCALE.has(strategy),
			redirectToDefaultLocale: !REDIRECT_TO_DEFAULT_LOCALE.has(strategy),
			fallbackType,
		};
	}
	return routing;
}
