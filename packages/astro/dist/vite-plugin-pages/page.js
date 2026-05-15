import { prependForwardSlash } from '../core/path.js';
import { DEFAULT_COMPONENTS } from '../core/routing/default.js';
import { routeIsRedirect } from '../core/routing/helpers.js';
import { VIRTUAL_PAGE_MODULE_ID, VIRTUAL_PAGE_RESOLVED_MODULE_ID } from './const.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
function pluginPage({ routesList }) {
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
				if (DEFAULT_COMPONENTS.some((component) => componentPath === component)) {
					return { code: '' };
				}
				const routes = routesList.routes.filter((route) => route.component === componentPath);
				for (const route of routes) {
					if (routeIsRedirect(route)) {
						continue;
					}
					const astroModuleId = prependForwardSlash(componentPath);
					const imports = [];
					const exports = [];
					imports.push(`import * as _page from ${JSON.stringify(astroModuleId)};`);
					exports.push(`export const page = () => _page`);
					return {
						code: `${imports.join('\n')}
${exports.join('\n')}`,
					};
				}
			},
		},
	};
}
function getComponentFromVirtualModulePageName(virtualModulePrefix, id) {
	return id.slice(virtualModulePrefix.length).replace(/@_@/g, '.');
}
export { pluginPage };
