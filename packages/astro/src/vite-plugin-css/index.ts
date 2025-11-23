import type { Plugin, RunnableDevEnvironment } from 'vite';
import { wrapId } from '../core/util.js';
import type { ImportedDevStyle, RoutesList } from '../types/astro.js';
import type * as vite from 'vite';
import { isBuildableCSSRequest } from '../vite-plugin-astro-server/util.js';
import { getVirtualModulePageNameForComponent } from '../vite-plugin-pages/util.js';
import { getDevCSSModuleName } from './util.js';
import { prependForwardSlash } from '@astrojs/internal-helpers/path';

interface AstroVitePluginOptions {
	routesList: RoutesList;
	command: 'dev' | 'build';
}

const MODULE_DEV_CSS = 'virtual:astro:dev-css';
const RESOLVED_MODULE_DEV_CSS = '\0' + MODULE_DEV_CSS;
const MODULE_DEV_CSS_PREFIX = 'virtual:astro:dev-css:';
const RESOLVED_MODULE_DEV_CSS_PREFIX = '\0' + MODULE_DEV_CSS_PREFIX;
const MODULE_DEV_CSS_ALL = 'virtual:astro:dev-css-all';
const RESOLVED_MODULE_DEV_CSS_ALL = '\0' + MODULE_DEV_CSS_ALL;
const ASTRO_CSS_EXTENSION_POST_PATTERN = '@_@';

/**
 * Extract the original component path from a masked virtual module name.
 * Inverse function of getVirtualModulePageName().
 */
function getComponentFromVirtualModuleCssName(virtualModulePrefix: string, id: string): string {
	return id
		.slice(virtualModulePrefix.length)
		.replace(new RegExp(ASTRO_CSS_EXTENSION_POST_PATTERN, 'g'), '.');
}

/**
 * Walk down the dependency tree to collect CSS with depth/order.
 * Performs depth-first traversal to ensure correct CSS ordering based on import order.
 */
function* collectCSSWithOrder(
	id: string,
	mod: vite.EnvironmentModuleNode,
	seen = new Set<string>(),
): Generator<ImportedDevStyle & { id: string; idKey: string }, void, unknown> {
	seen.add(id);

	// Keep all of the imported modules into an array so we can go through them one at a time
	const imported = Array.from(mod.importedModules);

	// Check if this module is CSS and should be collected
	if (isBuildableCSSRequest(id)) {
		yield {
			id,
			idKey: id,
			content: '',
			url: prependForwardSlash(wrapId(id)),
		};
		return;
	}
	// ?raw imports the underlying css but is handled as a string in the JS.
	else if(id.endsWith('?raw')) {
		return;
	}

	// Recursively walk imported modules (depth-first)
	for (const imp of imported) {
		if (imp.id && !seen.has(imp?.id)) {
			yield* collectCSSWithOrder(imp.id, imp, seen);
		}
	}
}

/**
 * This plugin tracks the CSS that should be applied by route.
 *
 * The virtual module should be used only during development.
 * Per-route virtual modules are created to avoid invalidation loops.
 *
 * The second plugin imports all of the individual CSS modules in a map.
 *
 * @param routesList
 */
export function astroDevCssPlugin({ routesList, command }: AstroVitePluginOptions): Plugin[] {
	let environment: undefined | RunnableDevEnvironment = undefined;
	// Cache CSS content by module ID to avoid re-reading
	const cssContentCache = new Map<string, string>();

	return [{
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
				const componentPath = getComponentFromVirtualModuleCssName(
					RESOLVED_MODULE_DEV_CSS_PREFIX,
					id,
				);

				// Collect CSS by walking the dependency tree from the component
				const cssWithOrder = new Map<string, ImportedDevStyle>();

				// The virtual module name for this page, like virtual:astro:dev-css:index@_@astro
				const componentPageId = getVirtualModulePageNameForComponent(componentPath);

				// Ensure the page module is loaded. This will populate the graph and allow us to walk through. 
				await environment?.runner?.import(componentPageId);
				const resolved = await environment?.pluginContainer.resolveId(componentPageId);

				if(!resolved?.id) {
					return {
						code: 'export const css = new Set()'
					};
				}

				// the vite.EnvironmentModuleNode has all of the info we need
				const mod = environment?.moduleGraph.getModuleById(resolved.id);

				if(!mod) {
					return {
						code: 'export const css = new Set()'
					};
				}

				// Walk through the graph depth-first
				for (const collected of collectCSSWithOrder(componentPageId, mod!)) {
					// Use the CSS file ID as the key to deduplicate while keeping best ordering
					if (!cssWithOrder.has(collected.idKey)) {
						// Look up actual content from cache if available
						const content = cssContentCache.get(collected.id) || collected.content;
						cssWithOrder.set(collected.idKey, { ...collected, content });
					}
				}

				const cssArray = Array.from(cssWithOrder.values());
				// Remove the temporary fields added during collection
				const cleanedCss = cssArray.map(({ content, id: cssId, url }) => ({ content, id: cssId, url }));
				return {
					code: `export const css = new Set(${JSON.stringify(cleanedCss)})`,
				};
			}
		},

		async transform(code, id) {
			if (command === 'build') {
				return;
			}

			// Cache CSS content as we see it
			if (isBuildableCSSRequest(id)) {
				const mod = environment?.moduleGraph.getModuleById(id);
				if (mod) {
					cssContentCache.set(id, code);
				}
			}
		},
	}, {
		name: MODULE_DEV_CSS_ALL,
		resolveId(id) {
			if(id === MODULE_DEV_CSS_ALL) {
				return RESOLVED_MODULE_DEV_CSS_ALL
			}
		},
		load(id) {
			if(id === RESOLVED_MODULE_DEV_CSS_ALL) {
				// Creates a map of the component name to a function to import it
				let code = `export const devCSSMap = new Map([`;
				for(const route of routesList.routes) {
					code += `\n\t[${JSON.stringify(route.component)}, () => import(${JSON.stringify(getDevCSSModuleName(route.component))})],`
				}
				code += ']);'
				return {
					code
				};
			}
		}
	}];
}
