import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';

const HAS_FILE_EXTENSION_REGEXP = /\.[^/]+$/;

interface ValidateRouteTrailingSlashOptions {
	url: string;
	routeData: RouteData;
	base: string;
	trailingSlash: AstroConfig['trailingSlash'];
}

type ValidateRouteTrailingSlashResult = { valid: true } | { valid: false; redirectUrl: string };

export function validateRouteTrailingSlash(
	opts: ValidateRouteTrailingSlashOptions,
): ValidateRouteTrailingSlashResult {
	const trailingSlash =
		opts.trailingSlash[opts.routeData.type === 'endpoint' ? 'endpoint' : 'page'];

	if (trailingSlash === 'ignore') return { valid: true };

	const pathname = cleanUrl(opts.url);
	if (pathname === '' || pathname === '/' || pathname === opts.base || pathname === opts.base + '/')
		return { valid: true };

	const hasTrailingSlash = pathname.endsWith('/');

	if (trailingSlash === 'never' && hasTrailingSlash) {
		const redirectUrl = pathname.slice(0, -1) + opts.url.slice(pathname.length);
		return { valid: false, redirectUrl };
	}

	if (
		trailingSlash === 'always' &&
		!hasTrailingSlash &&
		!HAS_FILE_EXTENSION_REGEXP.test(opts.url)
	) {
		const redirectUrl = pathname + '/' + opts.url.slice(pathname.length);
		return { valid: false, redirectUrl };
	}

	return { valid: true };
}

const postfixRE = /[?#].*$/s;
function cleanUrl(url: string): string {
	try {
		// Try to parse first since we patch `request.url` to be a full URL and sometimes
		// we might get that full URL, which we don't want. We only want the pathname
		const urlObj = new URL(url, 'http://localhost');
		return urlObj.pathname;
	} catch {
		return url.replace(postfixRE, '');
	}
}
