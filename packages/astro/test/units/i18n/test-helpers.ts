import type { RoutingStrategies } from '../../../dist/core/app/common.js';
import type { Locales } from '../../../dist/types/public/config.js';

export function makeI18nRouterConfig({
	strategy = 'pathname-prefix-other-locales',
	defaultLocale = 'en',
	locales = ['en', 'es', 'pt'],
	base = '',
	domains,
}: {
	strategy?: RoutingStrategies;
	defaultLocale?: string;
	locales?: Locales;
	base?: string;
	domains?: Record<string, string[]>;
} = {}) {
	return { strategy, defaultLocale, locales, base, domains };
}

export function makeRouterContext({
	currentLocale,
	currentDomain = 'example.com',
	routeType = 'page',
	isReroute = false,
}: {
	currentLocale?: string;
	currentDomain?: string;
	routeType?: string;
	isReroute?: boolean;
} = {}) {
	return { currentLocale, currentDomain, routeType, isReroute };
}

export function makeFallbackOptions({
	pathname,
	responseStatus = 404,
	currentLocale,
	fallback = {},
	fallbackType = 'redirect',
	locales = ['en', 'es', 'pt'],
	defaultLocale = 'en',
	strategy = 'pathname-prefix-other-locales',
	base = '',
}: {
	pathname: string;
	responseStatus?: number;
	currentLocale?: string;
	fallback?: Record<string, string>;
	fallbackType?: 'redirect' | 'rewrite';
	locales?: Locales;
	defaultLocale?: string;
	strategy?: RoutingStrategies;
	base?: string;
}) {
	return {
		pathname,
		responseStatus,
		currentLocale,
		fallback,
		fallbackType,
		locales,
		defaultLocale,
		strategy,
		base,
	};
}

export function createManualRoutingContext({
	pathname = '/',
	hostname = 'localhost',
	method = 'GET',
	currentLocale = undefined as string | undefined,
}: {
	pathname?: string;
	hostname?: string;
	method?: string;
	currentLocale?: string;
} = {}) {
	const url = new URL(`http://${hostname}${pathname}`);
	const request = new Request(url.toString(), { method });

	return {
		url,
		request,
		currentLocale,
		redirect(path: string, status = 302) {
			return new Response(null, {
				status,
				headers: { Location: path },
			});
		},
	};
}

export function createMiddlewarePayload({
	base = '',
	locales = ['en', 'es'] as Locales,
	trailingSlash = 'ignore' as 'always' | 'never' | 'ignore',
	format = 'directory' as 'directory' | 'file',
	strategy = 'pathname-prefix-other-locales' as RoutingStrategies,
	defaultLocale = 'en',
	domains = undefined as Record<string, string> | undefined,
	fallback = undefined as Record<string, string> | undefined,
	fallbackType = 'redirect' as 'redirect' | 'rewrite',
} = {}) {
	return {
		base,
		locales,
		trailingSlash,
		format,
		strategy,
		defaultLocale,
		domains,
		fallback,
		fallbackType,
	};
}
