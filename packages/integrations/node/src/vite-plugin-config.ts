import type { AstroConfig } from 'astro';
import type { Options } from './types.js';

const VIRTUAL_CONFIG_ID = 'virtual:astro-node:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

export function createConfigPlugin(
	config: Options,
): NonNullable<AstroConfig['vite']['plugins']>[number] {
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
