import type { AstroSettings } from '../../types/astro.js';

interface Options extends Pick<AstroSettings, 'injectedTypes'> {
	routePatterns: Array<string>;
	site: boolean;
	session: boolean;
	i18n:
		| {
				locales: NonNullable<AstroSettings['config']['i18n']>['locales'];
				defaultLocale: string;
		  }
		| undefined;
	csp: boolean;
}

function getCondition(enabled: boolean) {
	return enabled ? "'enabled'" : "'maybe'";
}

export function syncFeatures({ injectedTypes, routePatterns, site, session, i18n, csp }: Options) {
	injectedTypes.push({
		filename: 'internals.d.ts',
		content: `declare namespace AstroFeatures {
    type RoutePattern = (${JSON.stringify(routePatterns)})[number];
	type Site = ${getCondition(site)};
	type Session = ${getCondition(session)};
	type I18n = ${getCondition(!!i18n)};
	${i18n ? `type I18nLocale = (${JSON.stringify(i18n.locales.flatMap((locale) => (typeof locale === 'string' ? [locale] : locale.codes)))})[number];` : ''}
	${i18n ? `type I18nDefaultLocale = ${JSON.stringify(i18n.defaultLocale)};` : ''}
	type Csp = ${getCondition(csp)};
}`,
	});
}
