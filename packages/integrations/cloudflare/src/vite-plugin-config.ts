import type { PluginOption } from 'vite';

const VIRTUAL_CONFIG_ID = 'virtual:astro-cloudflare:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

interface CloudflareConfig {
	sessionKVBindingName: string;
}

export function createConfigPlugin(config: CloudflareConfig): PluginOption {
	return {
		name: 'vite:astro-cloudflare-config',
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
				return `export const sessionKVBindingName = ${JSON.stringify(config.sessionKVBindingName)};`;
			},
		},
	};
}
