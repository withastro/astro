import type { Plugin as VitePlugin } from 'vite';
import { isAstroServerEnvironment } from '../environments.js';
import type { AstroSettings } from '../types/astro.js';

const VIRTUAL_CLIENT_ID = 'virtual:astro:adapter-config/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

export function vitePluginAdapterConfig(settings: AstroSettings): VitePlugin {
	return {
		name: 'astro:adapter-config',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CLIENT_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CLIENT_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CLIENT_ID}$`),
			},
			handler() {
				// During SSR, return empty headers to avoid any runtime issues
				if (isAstroServerEnvironment(this.environment)) {
					return {
						code: `export const internalFetchHeaders = {};`,
					};
				}

				const adapter = settings.adapter;
				const clientConfig = adapter?.client || {};

				let internalFetchHeaders = {};
				if (clientConfig.internalFetchHeaders) {
					internalFetchHeaders =
						typeof clientConfig.internalFetchHeaders === 'function'
							? clientConfig.internalFetchHeaders()
							: clientConfig.internalFetchHeaders;
				}

				return {
					code: `export const internalFetchHeaders = ${JSON.stringify(internalFetchHeaders)};`,
				};
			},
		},
	};
}
