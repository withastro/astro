import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { LogOptions } from '../core/logger/core.js';
import { VIRTUAL_MODULE_ID } from './consts.js';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

export default function assets({ settings, logging }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:assets',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					export { getImage, Image } from "astro/assets";
				`;
			}
		},
	};
}
