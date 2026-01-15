import type { Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

export const ASTRO_STATIC_PATHS_MODULE_ID = 'astro:static-paths';
export const ASTRO_STATIC_PATHS_RESOLVED_ID = '\0' + ASTRO_STATIC_PATHS_MODULE_ID;

/**
 * Virtual module that exposes getStaticPaths for prerendering.
 * This allows adapters to call getStaticPaths from their runtime (e.g., workerd)
 * without Astro needing to import the bundle.
 *
 * Only works in the 'prerender' environment - returns no-op in other environments.
 */
export default function vitePluginStaticPaths(): Plugin {
	return {
		name: 'astro:static-paths',
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_STATIC_PATHS_MODULE_ID}$`),
			},
			handler() {
				return ASTRO_STATIC_PATHS_RESOLVED_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${ASTRO_STATIC_PATHS_RESOLVED_ID}$`),
			},
			handler() {
				// Only provide real implementation in prerender environment
				if (this.environment?.name !== ASTRO_VITE_ENVIRONMENT_NAMES.prerender) {
					return {
						code: `export async function getStaticPaths() { return []; }`,
					};
				}

				// Re-export from runtime module, binding manifest
				const code = `
import { getStaticPaths as _getStaticPaths } from 'astro/runtime/prerender/static-paths.js';
import { manifest } from 'virtual:astro:manifest';

export async function getStaticPaths() {
	return _getStaticPaths(manifest);
}
`;
				return { code };
			},
		},
	};
}
