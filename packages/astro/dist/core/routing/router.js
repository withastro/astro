import { prependForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { getParams } from '../render/params-and-props.js';
import { routeComparator } from './priority.js';
class Router {
	#routes;
	#base;
	#baseWithoutTrailingSlash;
	#buildFormat;
	#trailingSlash;
	constructor(routes, options) {
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
	match(inputPathname, { allowWithoutBase = false } = {}) {
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
function normalizeBase(base) {
	if (!base) return '/';
	if (base === '/') return base;
	return prependForwardSlash(base);
}
function getRedirectForPathname(pathname) {
	let value = prependForwardSlash(pathname);
	if (value.startsWith('//')) {
		const collapsed = `/${value.replace(/^\/+/, '')}`;
		return { pathname: value, redirect: collapsed };
	}
	return { pathname: value };
}
function stripBase(pathname, base, baseWithoutTrailingSlash, trailingSlash) {
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
function normalizeFileFormatPathname(pathname) {
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
export { Router };
