import type { Plugin as VitePlugin } from 'vite';
import { DEFAULT_COMPONENTS } from '../core/routing/default.js';
import { routeIsRedirect } from '../core/routing/index.js';
import type { RoutesList } from '../types/astro.js';
import { VIRTUAL_PAGE_MODULE_ID } from './const.js';
import { getVirtualModulePageName } from './util.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

export const VIRTUAL_PAGES_MODULE_ID = 'virtual:astro:pages';
const VIRTUAL_PAGES_RESOLVED_MODULE_ID = '\0' + VIRTUAL_PAGES_MODULE_ID;

interface PagesPluginOptions {
	routesList: RoutesList;
}

export function pluginPages({ routesList }: PagesPluginOptions): VitePlugin {
	return {
		name: '@astro/plugin-pages',
		enforce: 'post',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_PAGES_MODULE_ID}$`),
			},
			handler() {
				return VIRTUAL_PAGES_RESOLVED_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${VIRTUAL_PAGES_RESOLVED_MODULE_ID}$`),
			},
			async handler() {
				const imports: string[] = [];
				const pageMap: string[] = [];
				let i = 0;

				for (const route of routesList.routes) {
					if (routeIsRedirect(route)) {
						continue;
					}

					// Skip default components (404, server islands, etc.)
					if (DEFAULT_COMPONENTS.some((component) => route.component === component)) {
						continue;
					}

					const virtualModuleName = getVirtualModulePageName(
						VIRTUAL_PAGE_MODULE_ID,
						route.component,
					);
					const module = await this.resolve(virtualModuleName);
					if (module) {
						const variable = `_page${i}`;
						// use the non-resolved ID to resolve correctly the virtual module
						imports.push(`const ${variable} = () => import("${virtualModuleName}");`);
						pageMap.push(`[${JSON.stringify(route.component)}, ${variable}]`);
						i++;
					}
				}

				const pageMapCode = `const pageMap = new Map([\n    ${pageMap.join(',\n    ')}\n]);\n\nexport { pageMap };`;
				return { code: [...imports, pageMapCode].join('\n') };
			},
		},
	};
}
