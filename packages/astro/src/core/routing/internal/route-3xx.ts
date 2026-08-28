import type { RouteData } from '../../../types/public/internal.js';

export function isRoute3xx(
	route: Pick<RouteData, 'route' | 'type' | 'component' | 'origin'>,
): boolean {
	return (
		route.route === '/3xx' &&
		route.type === 'page' &&
		route.origin === 'project' &&
		(route.component === '3xx.astro' || route.component.endsWith('/3xx.astro'))
	);
}
