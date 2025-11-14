import type { Plugin as VitePlugin } from 'vite';
import { prependForwardSlash } from '../core/path.js';
import { routeIsRedirect } from '../core/redirects/index.js';
import { DEFAULT_COMPONENTS } from '../core/routing/default.js';
import type { RoutesList } from '../types/astro.js';
import { ASTRO_RENDERERS_MODULE_ID } from '../vite-plugin-renderers/index.js';

export const VIRTUAL_PAGE_MODULE_ID = 'virtual:astro:page:';
export const VIRTUAL_PAGE_RESOLVED_MODULE_ID = '\0' + VIRTUAL_PAGE_MODULE_ID;

interface PagePluginOptions {
	routesList: RoutesList;
}

export function pluginPage({ routesList }: PagePluginOptions): VitePlugin {
	return {
		name: '@astro/plugin-page',
		applyToEnvironment(environment) {
			return environment.name === 'ssr' || environment.name === 'prerender';
		},
		resolveId(id) {
			if (id.startsWith(VIRTUAL_PAGE_MODULE_ID)) {
				return VIRTUAL_PAGE_RESOLVED_MODULE_ID + id.slice(VIRTUAL_PAGE_MODULE_ID.length);
			}
		},
		async load(id) {
			if (id.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID)) {
				const componentPath = getComponentFromVirtualModulePageName(
					VIRTUAL_PAGE_RESOLVED_MODULE_ID,
					id,
				);

				// Skip default components (404, server islands, etc.)
				if (DEFAULT_COMPONENTS.some((component) => componentPath === component)) {
					return { code: '' };
				}

				// Find the route(s) that use this component
				const routes = routesList.routes.filter((route) => route.component === componentPath);

				for (const route of routes) {
					if (routeIsRedirect(route)) {
						continue;
					}

					const astroModuleId = prependForwardSlash(componentPath);
					const imports: string[] = [];
					const exports: string[] = [];

					imports.push(`import * as _page from ${JSON.stringify(astroModuleId)};`);
					exports.push(`export const page = () => _page`);

					imports.push(`import { renderers } from "${ASTRO_RENDERERS_MODULE_ID}";`);
					exports.push(`export { renderers };`);

					return { code: `${imports.join('\n')}\n${exports.join('\n')}` };
				}
			}
		},
	};
}

/**
 * From the VirtualModulePageName, get the component path.
 * Remember that the component can be use by multiple routes.
 */
export function getComponentFromVirtualModulePageName(virtualModulePrefix: string, id: string): string {
	return id.slice(virtualModulePrefix.length).replace(/@_@/g, '.');
}
