import type { PluginOption } from 'vite';

const VIRTUAL_CONFIG_ID = 'virtual:astro-netlify:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

export interface Config {
	middlewareSecret: string;
	cacheOnDemandPages: boolean;
}

export function createConfigPlugin(config: Config): PluginOption {
	return {
		name: VIRTUAL_CONFIG_ID,
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CONFIG_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CONFIG_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CONFIG_ID}$`),
			},
			handler() {
				return Object.entries(config)
					.map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`)
					.join('\n');
			},
		},
	};
}
