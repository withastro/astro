import type { RouteData } from '../../../types.js';

const PRERENDER_REGEX = /^\s*export\s+const\s+prerender\s*=\s*(true|false);?/m;

/**
 * Parses the `export const prerender = true|false` declaration from a route's
 * source content. Returns `true`, `false`, or `undefined` if not present.
 */
export function parsePrerenderExport(content: string): boolean | undefined {
	const match = PRERENDER_REGEX.exec(content);
	if (!match) return undefined;
	return match[1] === 'true';
}

/**
 * Sets `route.prerender` from the `prerender` export in the route's source `content`, then runs
 * `onRouteSetup`, which can override it.
 */
export async function getRoutePrerenderOption(
	content: string,
	route: RouteData,
	onRouteSetup?: (route: RouteData) => void | Promise<void>,
) {
	// Check if the route is pre-rendered or not
	const match = PRERENDER_REGEX.exec(content);
	if (match) {
		route.prerender = match[1] === 'true';
		if (route.redirectRoute) {
			route.redirectRoute.prerender = match[1] === 'true';
		}
	}

	await onRouteSetup?.(route);
}
