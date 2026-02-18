import type { AstroConfig } from '../../types/public/config.js';
import type { Params } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { getParams } from '../render/params-and-props.js';
import { routeComparator } from './priority.js';

export interface RouterOptions {
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: 'directory' | 'file' | 'preserve';
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
	status: 301 | 308;
}

interface RouterMatchNone {
	type: 'none';
	reason: 'no-match' | 'outside-base';
}

export type RouterMatch = RouterMatchRoute | RouterMatchRedirect | RouterMatchNone;

export class Router {
	#routes: RouteData[];
	#base: string;
	#baseWithoutTrailingSlash: string;
	#buildFormat: RouterOptions['buildFormat'];
	#trailingSlash: RouterOptions['trailingSlash'];

	constructor(routes: RouteData[], options: RouterOptions) {
		this.#routes = [...routes].sort(routeComparator);
		this.#base = normalizeBase(options.base);
		this.#baseWithoutTrailingSlash = removeTrailingSlash(this.#base);
		this.#buildFormat = options.buildFormat;
		this.#trailingSlash = options.trailingSlash;
	}

	public match(inputPathname: string): RouterMatch {
		const normalized = normalizePathname(inputPathname);
		if (normalized.redirect) {
			return { type: 'redirect', location: normalized.redirect, status: 301 };
		}

		const baseResult = stripBase(
			normalized.pathname,
			this.#base,
			this.#baseWithoutTrailingSlash,
			this.#trailingSlash,
		);
		if (!baseResult) {
			return { type: 'none', reason: 'outside-base' };
		}

		let pathname = baseResult;
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

function normalizeBase(base: string): string {
	if (!base) return '/';
	if (base === '/') return '/';
	if (!base.startsWith('/')) return `/${base}`;
	return base;
}

function removeTrailingSlash(value: string): string {
	if (value === '/') return '/';
	return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizePathname(pathname: string): { pathname: string; redirect?: string } {
	let value = pathname;
	if (!value.startsWith('/')) {
		value = `/${value}`;
	}

	if (value.startsWith('//')) {
		return { pathname: value, redirect: '/' };
	}

	return { pathname: value };
}

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
