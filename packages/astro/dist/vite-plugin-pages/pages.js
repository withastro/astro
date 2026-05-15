import { DEFAULT_COMPONENTS } from '../core/routing/default.js';
import { routeIsRedirect } from '../core/routing/helpers.js';
import { VIRTUAL_PAGE_MODULE_ID } from './const.js';
import { getVirtualModulePageName } from './util.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
const VIRTUAL_PAGES_MODULE_ID = 'virtual:astro:pages';
const VIRTUAL_PAGES_RESOLVED_MODULE_ID = '\0' + VIRTUAL_PAGES_MODULE_ID;
function getRoutesForEnvironment(routes, isPrerender) {
	const result = /* @__PURE__ */ new Set();
	for (const route of routes) {
		if (route.prerender === isPrerender) {
			result.add(route);
		}
		if (route.redirectRoute) {
			result.add(route.redirectRoute);
		}
	}
	return result;
}
function pluginPages({ routesList }) {
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
				const imports = [];
				const pageMap = [];
				let i = 0;
				const envName = this.environment.name;
				const isSSR = envName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
				const isPrerender = envName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender;
				const routes =
					isSSR || isPrerender
						? getRoutesForEnvironment(routesList.routes, isPrerender)
						: new Set(routesList.routes);
				for (const route of routes) {
					if (routeIsRedirect(route)) {
						continue;
					}
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
						imports.push(`const ${variable} = () => import("${virtualModuleName}");`);
						pageMap.push(`[${JSON.stringify(route.component)}, ${variable}]`);
						i++;
					}
				}
				const pageMapCode = `const pageMap = new Map([
    ${pageMap.join(',\n    ')}
]);

export { pageMap };`;
				return { code: [...imports, pageMapCode].join('\n') };
			},
		},
	};
}
export { VIRTUAL_PAGES_MODULE_ID, pluginPages };
