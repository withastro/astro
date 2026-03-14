import type * as vite from 'vite';
import { toRoutingStrategy } from '../core/app/common.js';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import { isAstroClientEnvironment } from '../environments.js';
import type { AstroSettings } from '../types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:i18n';
const RESOLVED_VIRTUAL_MODULE_ID = '\0astro:i18n';

type AstroInternationalization = {
	settings: AstroSettings;
};

export default function astroInternationalization({
	settings,
}: AstroInternationalization): vite.Plugin {
	const { i18n } = settings.config;
	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (i18n === undefined) throw new AstroError(AstroErrorData.i18nNotEnabled);
				if (isAstroClientEnvironment(this.environment)) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				return this.resolve('astro/virtual-modules/i18n.js');
			},
		},
		load: {
			filter: {
				id: new RegExp(`^\0astro:i18n$`),
			},
			handler(id) {
				if (id === RESOLVED_VIRTUAL_MODULE_ID) {
					return { code: generateClientModule(settings) };
				}
			},
		},
	};
}

function generateClientModule(settings: AstroSettings): string {
	const { i18n } = settings.config;
	if (!i18n) return '';

	const strategy = JSON.stringify(toRoutingStrategy(i18n.routing, i18n.domains));
	const base = JSON.stringify(settings.config.base);
	const trailingSlash = JSON.stringify(settings.config.trailingSlash);
	const site = JSON.stringify(settings.config.site ?? undefined);
	const format = JSON.stringify(settings.config.build.format);
	const defaultLocale = JSON.stringify(i18n.defaultLocale);
	const locales = JSON.stringify(i18n.locales);
	const domains = JSON.stringify(i18n.domains ?? undefined);

	return `
import {
	getLocaleRelativeUrl,
	getLocaleAbsoluteUrl,
	getLocaleRelativeUrlList,
	getLocaleAbsoluteUrlList,
	getPathByLocale as _getPathByLocale,
	getLocaleByPath as _getLocaleByPath,
	pathHasLocale as _pathHasLocale,
	normalizeTheLocale,
	toCodes,
	toPaths,
} from 'astro/virtual-modules/i18n-utils.js';

const base = ${base};
const trailingSlash = ${trailingSlash};
const site = ${site};
const format = ${format};
const defaultLocale = ${defaultLocale};
const locales = ${locales};
const domains = ${domains};
const strategy = ${strategy};
const isBuild = import.meta.env.PROD;

export { normalizeTheLocale, toCodes, toPaths };

export const getRelativeLocaleUrl = (locale, path, options) =>
	getLocaleRelativeUrl({
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

export const getAbsoluteLocaleUrl = (locale, path, options) =>
	getLocaleAbsoluteUrl({
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

export const getRelativeLocaleUrlList = (path, options) =>
	getLocaleRelativeUrlList({
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

export const getAbsoluteLocaleUrlList = (path, options) =>
	getLocaleAbsoluteUrlList({
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

export const getPathByLocale = (locale) => _getPathByLocale(locale, locales);
export const getLocaleByPath = (path) => _getLocaleByPath(path, locales);
export const pathHasLocale = (path) => _pathHasLocale(path, locales);

function serverOnly(method) {
	return function() {
		throw new Error(method + '() is a server-only function and cannot be used on the client.');
	};
}

export const redirectToDefaultLocale = serverOnly('redirectToDefaultLocale');
export const notFound = serverOnly('notFound');
export const requestHasLocale = serverOnly('requestHasLocale');
export const redirectToFallback = serverOnly('redirectToFallback');
export const middleware = serverOnly('middleware');
`;
}
