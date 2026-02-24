import type { AstroConfig } from '../../types/public/config.js';
import type { Params } from '../../types/public/common.js';
import type { ValidRedirectStatus } from '../../types/public/config.js';
import { prependForwardSlash, removeTrailingForwardSlash } from '../path.js';
import type { RouteData } from '../../types/public/internal.js';
import { getParams } from '../render/params-and-props.js';
import { routeComparator } from './priority.js';

/**
 * Router options derived from the active Astro config.
 * Controls base matching, trailing slash handling, and build output format.
 */
export interface RouterOptions {
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: NonNullable<AstroConfig['build']>['format'];
}

interface RouterMatchRoute {
	type: 'match';
	route: RouteData;
	params: Params;
	pathname: string;
}

interface RouterMatchRedirect {
	type: 'redirect';
	location: string;
	status: ValidRedirectStatus;
}

interface RouterMatchNone {
	type: 'none';
	reason: 'no-match' | 'outside-base';
}

/**
 * Result of routing a pathname.
 * - match: route was found, includes route data and params.
 * - redirect: canonical redirect (trailing slash or leading slash normalization).
 * - none: no match (either outside base or no route pattern matched).
 */
export type RouterMatch = RouterMatchRoute | RouterMatchRedirect | RouterMatchNone;

/**
 * Matches request pathnames against a route list with base and trailing slash rules.
 */
export class Router {
	#routes: RouteData[];
	#base: string;
	#baseWithoutTrailingSlash: string;
	#buildFormat: RouterOptions['buildFormat'];
	#trailingSlash: RouterOptions['trailingSlash'];

	constructor(routes: RouteData[], options: RouterOptions) {
		// Copy before sorting to avoid mutating the caller's route list.
		// The Router owns route ordering to ensure consistent match priority.
		this.#routes = [...routes].sort(routeComparator);
		this.#base = normalizeBase(options.base);
		this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#base);
		this.#buildFormat = options.buildFormat;
		this.#trailingSlash = options.trailingSlash;
	}

	/**
	 * Match an input pathname against the route list.
	 * If allowWithoutBase is true, a non-base-prefixed path is still considered.
	 */
	public match(
		inputPathname: string,
		{ allowWithoutBase = false }: { allowWithoutBase?: boolean } = {},
	): RouterMatch {
		const normalized = getRedirectForPathname(inputPathname);
		if (normalized.redirect) {
			return { type: 'redirect', location: normalized.redirect, status: 301 };
		}

		if (this.#base !== '/') {
			const baseWithSlash = `${this.#baseWithoutTrailingSlash}/`;
			if (
				this.#trailingSlash === 'always' &&
				(normalized.pathname === this.#baseWithoutTrailingSlash ||
					normalized.pathname === this.#base)
			) {
				return { type: 'redirect', location: baseWithSlash, status: 301 };
			}
			if (this.#trailingSlash === 'never' && normalized.pathname === baseWithSlash) {
				return { type: 'redirect', location: this.#baseWithoutTrailingSlash, status: 301 };
			}
		}

		const baseResult = stripBase(
			normalized.pathname,
			this.#base,
			this.#baseWithoutTrailingSlash,
			this.#trailingSlash,
		);
		if (!baseResult) {
			if (!allowWithoutBase) {
				return { type: 'none', reason: 'outside-base' };
			}
		}

		let pathname = baseResult ?? normalized.pathname;
		if (this.#buildFormat === 'file') {
			pathname = normalizeFileFormatPathname(pathname);
		}

		const route = this.#routes.find((candidate) => {
			if (candidate.pattern.test(pathname)) return true;
			return candidate.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
		});

		if (!route) {
			return { type: 'none', reason: 'no-match' };
		}

		const params = getParams(route, pathname);
		return { type: 'match', route, params, pathname };
	}
}

/**
 * Normalize a base path to a leading-slash form.
 */
function normalizeBase(base: string): string {
	if (!base) return '/';
	if (base === '/') return base;
	return prependForwardSlash(base);
}

/**
 * Provide a redirect target for pathnames that need correction.
 * - Ensures a leading slash.
 * - Collapses multiple leading slashes into a single slash redirect.
 */
function getRedirectForPathname(pathname: string): {
	pathname: string;
	redirect?: string;
} {
	let value = prependForwardSlash(pathname);

	if (value.startsWith('//')) {
		const collapsed = `/${value.replace(/^\/+/, '')}`;
		return { pathname: value, redirect: collapsed };
	}

	return { pathname: value };
}

/**
 * Strip the configured base from the pathname and account for trailing slash policies.
 * Returns null if the pathname is outside the base or should be redirected elsewhere.
 */
function stripBase(
	pathname: string,
	base: string,
	baseWithoutTrailingSlash: string,
	trailingSlash: RouterOptions['trailingSlash'],
): string | null {
	if (base === '/') return pathname;
	const baseWithSlash = `${baseWithoutTrailingSlash}/`;

	if (pathname === baseWithoutTrailingSlash || pathname === base) {
		return trailingSlash === 'always' ? null : '/';
	}
	if (pathname === baseWithSlash) {
		return trailingSlash === 'never' ? null : '/';
	}
	if (pathname.startsWith(baseWithSlash)) {
		return pathname.slice(baseWithoutTrailingSlash.length);
	}

	return null;
}

/**
 * Normalize file-format pathnames by removing .html and /index.html suffixes.
 */
function normalizeFileFormatPathname(pathname: string): string {
	if (pathname.endsWith('/index.html')) {
		const trimmed = pathname.slice(0, -'/index.html'.length);
		return trimmed === '' ? '/' : trimmed;
	}

	if (pathname.endsWith('.html')) {
		const trimmed = pathname.slice(0, -'.html'.length);
		return trimmed === '' ? '/' : trimmed;
	}

	return pathname;
}
