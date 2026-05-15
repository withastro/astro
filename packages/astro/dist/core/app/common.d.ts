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
export declare function toRoutingStrategy(
	routing: NonNullable<AstroConfig['i18n']>['routing'],
	domains: NonNullable<AstroConfig['i18n']>['domains'],
): RoutingStrategies;
export declare function toFallbackType(
	routing: NonNullable<AstroConfig['i18n']>['routing'],
): 'redirect' | 'rewrite';
export declare function fromRoutingStrategy(
	strategy: RoutingStrategies,
	fallbackType: NonNullable<SSRManifest['i18n']>['fallbackType'],
): NonNullable<AstroConfig['i18n']>['routing'];
