import type { AstroConfig } from 'astro';
import type { UserOptions } from './types.js';

const VIRTUAL_CONFIG_ID = 'virtual:astro-node:env-schema';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

const SERVER_ENVIRONMENTS = ['ssr', 'prerender', 'astro'];

export function createConfigPluginEnv(
	schema: AstroConfig['env']['schema'],
	options: UserOptions,
): NonNullable<AstroConfig['vite']['plugins']>[number] {
	return {
		name: VIRTUAL_CONFIG_ID,
		configEnvironment(environmentName) {
			if (SERVER_ENVIRONMENTS.includes(environmentName)) {
				return {
					resolve: {
						noExternal: ['@astrojs/node'],
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
				const mustValidate = options.experimentalExitMissingVarEnv ?? false;
				return `
					export const schema = ${JSON.stringify(schema)}
					export const mustValidate = ${mustValidate}
				`.trim();
			},
		},
	};
}
