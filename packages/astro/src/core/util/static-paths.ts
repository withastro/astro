import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { AstroConfig } from '../../types/public/config.js';

const STATUS_CODE_PATHS = new Set(['404', '500']);

export interface StaticAssetPathOptions {
	base: string;
	buildFormat: NonNullable<AstroConfig['build']>['format'];
	/**
	 * Whether the route is an index route (e.g. `src/pages/blog/index.astro` → `/blog`).
	 * In `'preserve'` build format an index route emits `blog/index.html` while a non-index
	 * route emits `blog.html`, and the pathname alone can't distinguish the two. When
	 * omitted, a path heuristic is used as a best-effort fallback.
	 */
	isIndex?: boolean;
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

	if (options.buildFormat === 'preserve') {
		if (STATUS_CODE_PATHS.has(withoutTrailingSlash)) {
			return `${withoutTrailingSlash}.html`;
		}
		// Index routes emit `<name>/index.html`; other routes emit `<name>.html`.
		// Prefer the route's `isIndex` when the caller provides it (the pathname
		// alone can't tell `/blog` the index page from `/blog` a leaf page), and
		// fall back to a path heuristic otherwise.
		const isIndex =
			options.isIndex ??
			(withoutTrailingSlash === 'index' || withoutTrailingSlash.endsWith('/index'));
		if (isIndex) {
			return `${withoutTrailingSlash}/index.html`;
		}
	}

	if (withoutTrailingSlash.endsWith('.html')) {
		return withoutTrailingSlash;
	}

	return `${withoutTrailingSlash}.html`;
}
