import type { Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

const ASTRO_STATIC_PATHS_MODULE_ID = 'astro:static-paths';
const ASTRO_STATIC_PATHS_RESOLVED_ID = '\0' + ASTRO_STATIC_PATHS_MODULE_ID;

/**
 * Virtual module that exposes StaticPaths class for prerendering.
 * This allows adapters to use StaticPaths from their runtime (e.g., workerd)
 * to collect all prerenderable paths.
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
						code: `export class StaticPaths { async getAll() { return []; } }`,
					};
				}

				// Re-export StaticPaths class from runtime module
				return {
					code: `export { StaticPaths } from 'astro/runtime/prerender/static-paths.js';`,
				};
			},
		},
	};
}
