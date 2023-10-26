import * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';

const virtualModuleId = 'astro:i18n';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

type AstroInternalization = {
	settings: AstroSettings;
};

export default function astroInternalization({ settings }: AstroInternalization): vite.Plugin {
	return {
		name: 'astro:i18n',
		enforce: 'pre',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					import { 
						getLocaleRelativeUrl as _getLocaleRelativeUrl, 
						getLocaleRelativeUrlList as _getLocaleRelativeUrlList,
						getLocaleAbsoluteUrl as _getLocaleAbsoluteUrl, 
						getLocaleAbsoluteUrlList as _getLocaleAbsoluteUrlList,
						 
					} from "astro/i18n";
					
					const defaultLocale = ${JSON.stringify(settings.config.experimental.i18n!.defaultLocale)};
					const locales = ${JSON.stringify(settings.config.experimental.i18n!.locales)};
					const fallback = ${JSON.stringify(settings.config.experimental.i18n!.fallback)};
					const base =  ${JSON.stringify(settings.config.base)};
					const trailingSlash =  ${JSON.stringify(settings.config.trailingSlash)};
					const format =  ${JSON.stringify(settings.config.build.format)};
					const site = ${JSON.stringify(settings.config.site)};
					
					export const getLocaleRelativeUrl = (locale, path = "", opts) => _getLocaleRelativeUrl({ locale, path, base, locales, trailingSlash, format, ...opts });
					export const getLocaleAbsoluteUrl = (locale, path = "", opts) => _getLocaleAbsoluteUrl({ locale, path, base, locales, trailingSlash, format, site, ...opts });
					
					export const getLocaleRelativeUrlList = (path = "", opts) => _getLocaleRelativeUrlList({ base, path, locales, trailingSlash, format, ...opts });
					export const getLocaleAbsoluteUrlList = (path = "", opts) => _getLocaleAbsoluteUrlList({ base, path, locales, trailingSlash, format, site, ...opts });
				`;
			}
		},
	};
}
