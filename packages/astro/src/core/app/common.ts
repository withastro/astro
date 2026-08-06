import type { AstroConfig } from '../../types/public/index.js';
import type { SSRManifest } from './types.js';

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
