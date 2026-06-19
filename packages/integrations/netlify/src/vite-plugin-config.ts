import type { PluginOption } from 'vite';

const VIRTUAL_CONFIG_ID = 'virtual:astro-netlify:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

export interface Config {
	middlewareSecret: string;
	cacheOnDemandPages: boolean;
}

const SERVER_ENVIRONMENTS = ['ssr', 'prerender', 'astro'];

export function createConfigPlugin(config: Config): PluginOption {
	return {
		name: VIRTUAL_CONFIG_ID,
		configEnvironment(environmentName) {
			if (SERVER_ENVIRONMENTS.includes(environmentName)) {
				return {
					resolve: {
						noExternal: ['@astrojs/netlify'],
					},
				};
			}
		},
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
