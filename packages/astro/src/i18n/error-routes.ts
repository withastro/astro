import type { SSRManifest } from '../core/app/types.js';
import type { Locales } from '../types/public/config.js';
import { pathHasLocale } from './path.js';

export function isLocalizedErrorRoute(
	route: string,
	status: 404 | 500,
	locales: Locales | undefined,
): boolean {
	if (!locales) return false;
	const suffix = `/${status}`;
	if (!route.endsWith(suffix)) return false;
	const localeSegment = route.slice(0, -suffix.length);
	if (!localeSegment || localeSegment.includes('/', 1)) return false;
	return pathHasLocale(localeSegment, locales);
}

export function getErrorRoutePath(
	pathname: string,
	status: 404 | 500,
	routes: Pick<SSRManifest['routes'][number]['routeData'], 'route'>[],
	locales: Locales | undefined,
	appendTrailingSlash = false,
): string {
	const suffix = appendTrailingSlash ? '/' : '';
	if (locales) {
		const firstSegment = pathname.split('/').find(Boolean);
		if (firstSegment && pathHasLocale(`/${firstSegment}`, locales)) {
			const localized = `/${firstSegment}/${status}`;
			if (routes.some((route) => route.route === localized)) {
				return `${localized}${suffix}`;
			}
		}
	}
	return `/${status}${suffix}`;
}
