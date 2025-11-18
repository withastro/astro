import type { Plugin, RunnableDevEnvironment } from 'vite';
import { wrapId } from '../core/util.js';
import type { ImportedDevStyle, RoutesList } from '../types/astro.js';
import type { RouteData } from '../types/public/index.js';
import { isBuildableCSSRequest } from '../vite-plugin-astro-server/util.js';
import { getVirtualModulePageName } from '../vite-plugin-pages/util.js';

interface AstroVitePluginOptions {
	routesList: RoutesList;
	command: 'dev' | 'build';
}

const MODULE_DEV_CSS = 'virtual:astro:dev-css';
const RESOLVED_MODULE_DEV_CSS = '\0' + MODULE_DEV_CSS;
const MODULE_DEV_CSS_PREFIX = 'virtual:astro:dev-css:';
const RESOLVED_MODULE_DEV_CSS_PREFIX = '\0' + MODULE_DEV_CSS_PREFIX;
const ASTRO_CSS_EXTENSION_POST_PATTERN = '@_@';

/**
 * Extract the original component path from a masked virtual module name.
 * Inverse function of getVirtualModulePageName().
 */
function getComponentFromVirtualModuleCssName(virtualModulePrefix: string, id: string): string {
	return id.slice(virtualModulePrefix.length).replace(new RegExp(ASTRO_CSS_EXTENSION_POST_PATTERN, 'g'), '.');
}

/**
 * This plugin tracks the CSS that should be applied by route.
 *
 * The virtual module should be used only during development.
 * Per-route virtual modules are created to avoid invalidation loops.
 *
 * @param routesList
 */
export function astroDevCssPlugin({ routesList, command }: AstroVitePluginOptions): Plugin {
	let environment: undefined | RunnableDevEnvironment = undefined;
	let routeCssMap = new Map<string, Set<ImportedDevStyle>>();
	return {
		name: MODULE_DEV_CSS,

		async configureServer(server) {
			environment = server.environments.ssr as RunnableDevEnvironment;
		},

		resolveId(id) {
			if (id === MODULE_DEV_CSS) {
				return RESOLVED_MODULE_DEV_CSS;
			}
			if (id.startsWith(MODULE_DEV_CSS_PREFIX)) {
				return RESOLVED_MODULE_DEV_CSS_PREFIX + id.slice(MODULE_DEV_CSS_PREFIX.length);
			}
		},

		async load(id) {
			if (id === RESOLVED_MODULE_DEV_CSS) {
				return {
					code: `export const css = new Set()`,
				};
			}
			if (id.startsWith(RESOLVED_MODULE_DEV_CSS_PREFIX)) {
				const componentPath = getComponentFromVirtualModuleCssName(RESOLVED_MODULE_DEV_CSS_PREFIX, id);
				const cssSet = routeCssMap.get(componentPath) || new Set<ImportedDevStyle>();
				return {
					code: `export const css = new Set(${JSON.stringify(Array.from(cssSet.values()))})`,
				};
			}
		},

		async transform(code, id) {
			if (command === 'build') {
				return;
			}
			const info = this.getModuleInfo(id);
			if (!info) return;

			if (id.startsWith('/')) {
				const mod = environment?.moduleGraph.getModuleById(id);
				if (mod && isBuildableCSSRequest(id)) {
					// Find which routes use CSS that imports this file
					for (const route of routesList.routes) {
						if (!routeCssMap.has(route.component)) {
							routeCssMap.set(route.component, new Set());
						}
						const cssSet = routeCssMap.get(route.component)!;
						cssSet.add({
							content: code,
							id: wrapId(mod.id ?? mod.url),
							url: wrapId(mod.url),
						});
					}
					return;
				}
			}
		},
	};
}
