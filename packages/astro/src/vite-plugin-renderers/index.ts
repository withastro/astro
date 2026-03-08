import type { ConfigEnv, Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';

export const ASTRO_RENDERERS_MODULE_ID = 'virtual:astro:renderers';
const RESOLVED_ASTRO_RENDERERS_MODULE_ID = `\0${ASTRO_RENDERERS_MODULE_ID}`;

interface PluginOptions {
	settings: AstroSettings;
	routesList: RoutesList;
	command: ConfigEnv['command'];
}

/**
 * Checks whether any non-prerendered route needs component rendering (i.e., is a page).
 * Internal routes like `_server-islands` are excluded because they only need renderers
 * when server islands are actually used, and those are detected separately during the build.
 */
function ssrBuildNeedsRenderers(routesList: RoutesList): boolean {
	return routesList.routes.some(
		(route) => route.type === 'page' && !route.prerender && route.origin !== 'internal',
	);
}

export default function vitePluginRenderers(options: PluginOptions): VitePlugin {
	const renderers = options.settings.renderers;

	return {
		name: 'astro:plugin-renderers',
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_RENDERERS_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_ASTRO_RENDERERS_MODULE_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_ASTRO_RENDERERS_MODULE_ID}$`),
			},
			handler() {
				if (
					options.command === 'build' &&
					this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr &&
					renderers.length > 0 &&
					!ssrBuildNeedsRenderers(options.routesList)
				) {
					return { code: `export const renderers = [];` };
				}

				if (renderers.length > 0) {
					const imports: string[] = [];
					const exports: string[] = [];
					let i = 0;
					let rendererItems = '';

					for (const renderer of renderers) {
						const variable = `_renderer${i}`;
						imports.push(`import ${variable} from ${JSON.stringify(renderer.serverEntrypoint)};`);
						rendererItems += `Object.assign(${JSON.stringify(renderer)}, { ssr: ${variable} }),`;
						i++;
					}

					exports.push(`export const renderers = [${rendererItems}];`);

					return { code: `${imports.join('\n')}\n${exports.join('\n')}` };
				}
				return { code: `export const renderers = [];` };
			},
		},
	};
}
