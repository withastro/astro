import type { AstroSettings } from '../../types/astro.js';
import type { RouteData } from '../../types/public/index.js';

interface Options {
	settings: AstroSettings;
	routes: Array<RouteData>;
}

function getCondition(enabled: boolean) {
	return enabled ? 'enabled' : 'disabled';
}

export function syncInternals({ settings, routes }: Options) {
	settings.injectedTypes.push({
		filename: 'internals.d.ts',
		content: `declare namespace AstroInternals {
    export type RoutePattern = (${JSON.stringify(routes.map((r) => r.route))})[number];
	export type Site = ${JSON.stringify(getCondition(!!settings.config.site))};
}`,
	});
}
