import * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

const virtualModuleId = 'astro:i18n';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

type AstroInternalization = {
	settings: AstroSettings;
	logger: Logger;
};

export default function astroInternalization({ settings }: AstroInternalization): vite.Plugin {
	return {
		name: 'astro:i18n',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					import { getI18nBaseUrl as getI18nBaseUrlInternal, getLocalesBaseUrl as _getLocalesBaseUrl } from "astro/i18n";
					
					const defaultLocale = ${JSON.stringify(settings.config.experimental.i18n!.defaultLocale)};
					const locales = ${JSON.stringify(settings.config.experimental.i18n!.locales)};
					const fallback = ${JSON.stringify(settings.config.experimental.i18n!.fallback)};
					const base =  ${JSON.stringify(settings.config.base)};
					const trailingSlash =  ${JSON.stringify(settings.config.trailingSlash)};
					const format =  ${JSON.stringify(settings.config.build.format)};
					
					export const getI18nBaseUrl = (locale) => getI18nBaseUrlInternal({ locale, base, locales, trailingSlash, format });
					export const getLocalesBaseUrl = () => _getLocalesBaseUrl({ base, locales, trailingSlash, format });
				`;
			}
		},
	};
}
