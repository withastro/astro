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
