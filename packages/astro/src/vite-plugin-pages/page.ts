import type { Plugin as VitePlugin } from 'vite';
import { prependForwardSlash } from '../core/path.js';
import { DEFAULT_COMPONENTS } from '../core/routing/default.js';
import { routeIsRedirect } from '../core/routing/helpers.js';
import type { RoutesList } from '../types/astro.js';
import { VIRTUAL_PAGE_MODULE_ID, VIRTUAL_PAGE_RESOLVED_MODULE_ID } from './const.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

interface PagePluginOptions {
	routesList: RoutesList;
}

export function pluginPage({ routesList }: PagePluginOptions): VitePlugin {
	return {
		name: '@astro/plugin-page',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_PAGE_MODULE_ID}`),
			},
			handler(id) {
				return VIRTUAL_PAGE_RESOLVED_MODULE_ID + id.slice(VIRTUAL_PAGE_MODULE_ID.length);
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${VIRTUAL_PAGE_RESOLVED_MODULE_ID}`),
			},
			handler(id) {
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

					return { code: `${imports.join('\n')}\n${exports.join('\n')}` };
				}
			},
		},
	};
}

/**
 * From the VirtualModulePageName, get the component path.
 * Remember that the component can be use by multiple routes.
 */
function getComponentFromVirtualModulePageName(virtualModulePrefix: string, id: string): string {
	return id.slice(virtualModulePrefix.length).replace(/@_@/g, '.');
}
