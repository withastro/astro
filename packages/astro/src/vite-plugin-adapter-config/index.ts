import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';

const VIRTUAL_CLIENT_ID = 'astro:adapter-config/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

export function vitePluginAdapterConfig(settings: AstroSettings): VitePlugin {
	return {
		name: 'astro:adapter-config',
		resolveId(id) {
			if (id === VIRTUAL_CLIENT_ID) {
				return RESOLVED_VIRTUAL_CLIENT_ID;
			}
		},
		load(id, options) {
			if (id === RESOLVED_VIRTUAL_CLIENT_ID) {
				// During SSR, return empty headers to avoid any runtime issues
				if (options?.ssr) {
					return {
						code: `export const internalFetchHeaders = {};`,
					};
				}

				const adapter = settings.adapter;
				const runtimeConfig = adapter?.runtimeConfig || {};

				let internalFetchHeaders = {};
				if (runtimeConfig.internalFetchHeaders) {
					internalFetchHeaders =
						typeof runtimeConfig.internalFetchHeaders === 'function'
							? runtimeConfig.internalFetchHeaders()
							: runtimeConfig.internalFetchHeaders;
				}

				return {
					code: `export const internalFetchHeaders = ${JSON.stringify(internalFetchHeaders)};`,
				};
			}
		},
	};
}
