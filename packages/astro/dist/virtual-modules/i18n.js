import * as config from 'astro:config/server';
import { toFallbackType } from '../core/app/common.js';
import { toRoutingStrategy } from '../core/app/entrypoints/index.js';
import {
	IncorrectStrategyForI18n,
	InvalidI18nMiddlewareConfiguration,
} from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';
import * as I18nInternals from '../i18n/index.js';
const { trailingSlash, site, i18n, build } = config;
const { format } = build;
const isBuild = import.meta.env.PROD;
const { defaultLocale, locales, domains, fallback, routing } = i18n;
const base = import.meta.env.BASE_URL;
let strategy = toRoutingStrategy(routing, domains);
let fallbackType = toFallbackType(routing);
const noop = (method) =>
	function () {
		throw new AstroError({
			...IncorrectStrategyForI18n,
			message: IncorrectStrategyForI18n.message(method),
		});
	};
const getRelativeLocaleUrl = (locale, path, options) =>
	I18nInternals.getLocaleRelativeUrl({
		locale,
		path,
		base,
		trailingSlash,
		format,
		defaultLocale,
		locales,
		strategy,
		domains,
		...options,
	});
const getAbsoluteLocaleUrl = (locale, path, options) =>
	I18nInternals.getLocaleAbsoluteUrl({
		locale,
		path,
		base,
		trailingSlash,
		format,
		site,
		defaultLocale,
		locales,
		strategy,
		domains,
		isBuild,
		...options,
	});
const getRelativeLocaleUrlList = (path, options) =>
	I18nInternals.getLocaleRelativeUrlList({
		base,
		path,
		trailingSlash,
		format,
		defaultLocale,
		locales,
		strategy,
		domains,
		...options,
	});
const getAbsoluteLocaleUrlList = (path, options) =>
	I18nInternals.getLocaleAbsoluteUrlList({
		site,
		base,
		path,
		trailingSlash,
		format,
		defaultLocale,
		locales,
		strategy,
		domains,
		isBuild,
		...options,
	});
const getPathByLocale = (locale) => I18nInternals.getPathByLocale(locale, locales);
const getLocaleByPath = (path) => I18nInternals.getLocaleByPath(path, locales);
const pathHasLocale = (path) => I18nInternals.pathHasLocale(path, locales);
let redirectToDefaultLocale;
if (i18n?.routing === 'manual') {
	redirectToDefaultLocale = I18nInternals.redirectToDefaultLocale({
		base,
		trailingSlash,
		format,
		defaultLocale,
		locales,
		strategy,
		domains,
		fallback,
		fallbackType,
	});
} else {
	redirectToDefaultLocale = noop('redirectToDefaultLocale');
}
let notFound;
if (i18n?.routing === 'manual') {
	notFound = I18nInternals.notFound({
		base,
		trailingSlash,
		format,
		defaultLocale,
		locales,
		strategy,
		domains,
		fallback,
		fallbackType,
	});
} else {
	notFound = noop('notFound');
}
let requestHasLocale;
if (i18n?.routing === 'manual') {
	requestHasLocale = I18nInternals.requestHasLocale(locales);
} else {
	requestHasLocale = noop('requestHasLocale');
}
let redirectToFallback;
if (i18n?.routing === 'manual') {
	redirectToFallback = I18nInternals.redirectToFallback({
		base,
		trailingSlash,
		format,
		defaultLocale,
		locales,
		strategy,
		domains,
		fallback,
		fallbackType,
	});
} else {
	redirectToFallback = noop('useFallback');
}
let middleware;
if (i18n?.routing === 'manual') {
	middleware = (customOptions) => {
		if (
			customOptions.prefixDefaultLocale === false && // @ts-expect-error types do not allow this but we also check at runtime
			customOptions.redirectToDefaultLocale === true
		) {
			throw new AstroError(InvalidI18nMiddlewareConfiguration);
		}
		strategy = toRoutingStrategy(customOptions, {});
		fallbackType = toFallbackType(customOptions);
		const manifest = {
			...i18n,
			strategy,
			domainLookupTable: {},
			fallbackType,
			fallback: i18n.fallback,
			domains: i18n.domains,
		};
		return I18nInternals.createMiddleware(manifest, base, trailingSlash, format);
	};
} else {
	middleware = noop('middleware');
}
const normalizeTheLocale = I18nInternals.normalizeTheLocale;
const toCodes = I18nInternals.toCodes;
const toPaths = I18nInternals.toPaths;
export {
	getAbsoluteLocaleUrl,
	getAbsoluteLocaleUrlList,
	getLocaleByPath,
	getPathByLocale,
	getRelativeLocaleUrl,
	getRelativeLocaleUrlList,
	middleware,
	normalizeTheLocale,
	notFound,
	pathHasLocale,
	redirectToDefaultLocale,
	redirectToFallback,
	requestHasLocale,
	toCodes,
	toPaths,
};
