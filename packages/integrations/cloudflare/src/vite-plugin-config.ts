import type { PluginOption } from 'vite';

const VIRTUAL_CONFIG_ID = 'virtual:astro-cloudflare:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

interface CloudflareConfig {
	sessionKVBindingName: string;
}

export function createConfigPlugin(config: CloudflareConfig): PluginOption {
	return {
		name: 'vite:astro-cloudflare-config',
		resolveId(id) {
			if (id === VIRTUAL_CONFIG_ID) {
				return RESOLVED_VIRTUAL_CONFIG_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_CONFIG_ID) {
				return `export const sessionKVBindingName = ${JSON.stringify(config.sessionKVBindingName)};`;
			}
		},
	};
}
