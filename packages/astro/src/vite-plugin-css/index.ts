import type { Plugin, RunnableDevEnvironment } from 'vite';
import { wrapId } from '../core/util.js';
import type { ImportedDevStyle, RoutesList } from '../types/astro.js';
import type { RouteData } from '../types/public/index.js';
import { isBuildableCSSRequest } from '../vite-plugin-astro-server/util.js';

interface AstroVitePluginOptions {
	routesList: RoutesList;
	command: 'dev' | 'build';
}

const MODULE_DEV_CSS = 'virtual:astro:dev-css';
const RESOLVED_MODULE_DEV_CSS = '\0' + MODULE_DEV_CSS;

/**
 * This plugin tracks the CSS that should be applied by route.
 *
 * The virtual module should be used only during development
 *
 * @param routesList
 */
export function astroDevCssPlugin({ routesList, command }: AstroVitePluginOptions): Plugin {
	let environment: undefined | RunnableDevEnvironment = undefined;
	let cssMap = new Set<ImportedDevStyle>();
	let currentRoute: RouteData | undefined = undefined;
	return {
		name: MODULE_DEV_CSS,

		async configureServer(server) {
			environment = server.environments.ssr as RunnableDevEnvironment;

			server.middlewares.use(async (req, _res, next) => {
				if (!req.url) return next();

				currentRoute = routesList.routes.find((r) => req.url && r.pattern.test(req.url));
				return next();
			});
		},

		applyToEnvironment(env) {
			return env.name === 'ssr' || env.name === 'astro';
		},

		resolveId(id) {
			if (id === MODULE_DEV_CSS) {
				return RESOLVED_MODULE_DEV_CSS;
			}
		},

		async load(id) {
			if (id === RESOLVED_MODULE_DEV_CSS) {
				return {
					code: `export const css = new Set()`,
				};
			}
		},

		async transform(code, id) {
			if (command === 'build') {
				return;
			}
			const info = this.getModuleInfo(id);
			if (!info) return;

			if (id.startsWith('/') && currentRoute) {
				const mod = environment?.moduleGraph.getModuleById(id);
				if (mod) {
					if (isBuildableCSSRequest(id)) {
						cssMap.add({
							content: code,
							id: wrapId(mod.id ?? mod.url),
							url: wrapId(mod.url),
						});
						environment?.moduleGraph.invalidateModule(mod);
						return;
					}
				}
			}

			const hasAddedCss = cssMap.size > 0;
			const mod = environment?.moduleGraph.getModuleById(RESOLVED_MODULE_DEV_CSS);
			if (mod) {
				environment?.moduleGraph.invalidateModule(mod);
			}

			if (id === RESOLVED_MODULE_DEV_CSS && hasAddedCss) {
				const moduleCode = `export const css = new Set(${JSON.stringify(Array.from(cssMap.values()))})`;
				// We need to clear the map, so the next time we render a new page
				// we return the new CSS
				cssMap.clear();
				return moduleCode;
			}
		},
	};
}
