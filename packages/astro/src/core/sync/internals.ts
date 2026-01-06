import type { AstroSettings } from '../../types/astro.js';
import type { RouteData } from '../../types/public/index.js';

interface Options {
	settings: AstroSettings;
	routes: Array<RouteData>;
}

export function syncInternals({ settings, routes }: Options) {
	settings.injectedTypes.push({
		filename: 'internals.d.ts',
		content: `declare namespace AstroInternals {
    export type RoutePattern = (${JSON.stringify(routes.map((r) => r.route))})[number];
}`,
	});
}
