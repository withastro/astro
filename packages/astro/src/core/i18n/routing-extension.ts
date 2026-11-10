import type { RoutingExtension } from '@astrojs/vite-plugin-router';
import { pathHasLocale } from '../../i18n/path.js';
import { isLocalizedErrorRoute } from '../../i18n/error-routes.js';
import { computePathnameFromDomain } from './domain.js';

/**
 * Domain-based locale routing (the pathname is derived from the request host) and per-locale
 * error pages (`/es/404`).
 */
const i18nRouting: RoutingExtension = {
	resolvePathname({ manifest, request, url, pathname, logger }) {
		return computePathnameFromDomain(
			request,
			url,
			manifest.i18n,
			manifest.base,
			manifest.trailingSlash,
			manifest.allowedDomains,
			logger,
			pathname,
		);
	},
	getErrorRoute({ manifest, pathname, status }) {
		const locales = manifest.i18n?.locales;
		if (!locales) return undefined;
		const firstSegment = pathname.split('/').find(Boolean);
		if (firstSegment && pathHasLocale(`/${firstSegment}`, locales)) {
			return `/${firstSegment}/${status}`;
		}
		return undefined;
	},
	isErrorRoute({ manifest, route, status }) {
		return isLocalizedErrorRoute(route, status, manifest.i18n?.locales);
	},
};
export default i18nRouting;
