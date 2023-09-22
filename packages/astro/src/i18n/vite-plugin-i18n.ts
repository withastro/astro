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
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					import { getI18nBaseUrl as getI18nBaseUrlInternal } from "astro/i18n";
								
					export getI18nBaseUrl = (locale) => getI18nBaseUrlInternal(locale, ${settings.config});
				`;
			}
		},
	};
}
