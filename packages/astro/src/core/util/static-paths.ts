import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { AstroConfig } from '../../types/public/config.js';

const STATUS_CODE_PATHS = new Set(['404', '500']);

export interface StaticAssetPathOptions {
	base: string;
	buildFormat: NonNullable<AstroConfig['build']>['format'];
}

function decodePathname(pathname: string): string {
	try {
		return decodeURI(pathname);
	} catch {
		// Keep the original pathname when it contains malformed escape sequences.
		return pathname;
	}
}

export function stripBasePathname(pathname: string, base: string): string {
	const normalizedBase = removeTrailingForwardSlash(base || '/');
	if (normalizedBase !== '' && normalizedBase !== '/' && pathname.startsWith(normalizedBase)) {
		const withoutBase = pathname.slice(normalizedBase.length);
		return withoutBase.startsWith('/') ? withoutBase : `/${withoutBase}`;
	}
	return pathname;
}

export function getStaticAssetPath(pathname: string, options: StaticAssetPathOptions): string {
	const decodedPathname = decodePathname(pathname);
	const baselessPathname = stripBasePathname(decodedPathname, options.base);
	const withoutLeadingSlash = baselessPathname.replace(/^\/+/, '');
	const withoutTrailingSlash = withoutLeadingSlash.replace(/\/+$/, '');

	if (withoutTrailingSlash === '') {
		return 'index.html';
	}

	if (options.buildFormat === 'directory') {
		if (STATUS_CODE_PATHS.has(withoutTrailingSlash)) {
			return `${withoutTrailingSlash}.html`;
		}
		return `${withoutTrailingSlash}/index.html`;
	}

	if (withoutTrailingSlash.endsWith('.html')) {
		return withoutTrailingSlash;
	}

	return `${withoutTrailingSlash}.html`;
}