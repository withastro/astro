import type { Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './constants.js';

export function experimentalZod4VitePlugin({ settings }: { settings: AstroSettings }): Plugin {
	return {
		name: VIRTUAL_MODULE_ID,
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return `export const experimentalZod4 = ${JSON.stringify(settings.config.experimental.zod4)};`;
			}
		},
	};
}
