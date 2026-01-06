import type { AstroSettings } from '../../types/astro.js';
import type { RouteData } from '../../types/public/index.js';

interface Options {
	settings: AstroSettings;
	routes: Array<RouteData>;
}

function getCondition(enabled: boolean) {
	return enabled ? "'enabled'" : "'disabled'";
}

export function syncInternals({ settings, routes }: Options) {
	settings.injectedTypes.push({
		filename: 'internals.d.ts',
		content: `declare namespace AstroInternals {
    export type RoutePattern = (${JSON.stringify(routes.map((r) => r.route))})[number];
	export type Site = ${getCondition(!!settings.config.site)};
	export type Session = ${getCondition(!!settings.config.session?.driver)};
	export type I18n = ${getCondition(!!settings.config.i18n)};
	${settings.config.i18n ? `export type I18nLocale = (${JSON.stringify(settings.config.i18n.locales)})[number];` : ''}
}`,
	});
}
