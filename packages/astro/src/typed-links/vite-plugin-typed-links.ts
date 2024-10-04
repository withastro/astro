import type { Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import { MODULE_TEMPLATE_URL, RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './constants.js';
import { readFileSync } from 'node:fs';

interface TypedLinksPluginParams {
	settings: AstroSettings;
}

export function astroTypedLinks({ settings }: TypedLinksPluginParams): Plugin | undefined {
	if (!settings.config.experimental.typedLinks) {
		return;
	}

	const module = readFileSync(MODULE_TEMPLATE_URL, 'utf-8');

	return {
		name: 'astro-typed-links-plugin',
		enforce: 'pre',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return module;
			}
		},
	};
}
