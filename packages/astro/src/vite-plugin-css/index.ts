import { prependForwardSlash } from '@astrojs/internal-helpers/path';
import type * as vite from 'vite';
import type { DevEnvironment, Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { wrapId } from '../core/util.js';
import type { ImportedDevStyle, RoutesList } from '../types/astro.js';
import { inlineRE, isBuildableCSSRequest, rawRE } from '../vite-plugin-astro-server/util.js';
import { getVirtualModulePageNameForComponent } from '../vite-plugin-pages/util.js';
import { getDevCSSModuleName } from './util.js';
import { CSS_LANGS_RE } from '../core/viteUtils.js';
import { PROPAGATED_ASSET_QUERY_PARAM } from '../content/consts.js';
import {
	ASTRO_CSS_EXTENSION_POST_PATTERN,
	MODULE_DEV_CSS,
	MODULE_DEV_CSS_ALL,
	MODULE_DEV_CSS_PREFIX,
	RESOLVED_MODULE_DEV_CSS,
	RESOLVED_MODULE_DEV_CSS_ALL,
	RESOLVED_MODULE_DEV_CSS_PREFIX,
} from './const.js';

interface AstroVitePluginOptions {
	routesList: RoutesList;
	command: 'dev' | 'build';
}

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

	// Stop traversing if we reach an asset propagation stopping point to ensure we only collect CSS
	// relevant to a content collection entry, if any. Not doing so could cause CSS from other
	// entries to potentially be collected and bleed into the CSS included on the page, causing
	// unexpected styles, for example when a module shared between 2 pages would import
	// `astro:content` and thus potentially adding multiple content collection entry assets to the
	// module graph.
	if (id.includes(PROPAGATED_ASSET_QUERY_PARAM)) {
		return;
	}

	// Keep all of the imported modules into an array so we can go through them one at a time
	const imported = Array.from(mod.importedModules);

	// Check if this module is CSS and should be collected
	if (isBuildableCSSRequest(id)) {
		yield {
			id: wrapId(mod.id ?? mod.url),
			idKey: id,
			content: '',
			url: prependForwardSlash(wrapId(mod.url)),
		};
		return;
	}
	// ?raw imports the underlying css but is handled as a string in the JS.
	else if (id.endsWith('?raw')) {
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
	let ssrEnvironment: undefined | DevEnvironment = undefined;
	// Cache CSS content by module ID to avoid re-reading
	const cssContentCache = new Map<string, string>();

	return [
		{
			name: MODULE_DEV_CSS,

			async configureServer(server) {
				ssrEnvironment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			},
			applyToEnvironment(env) {
				return (
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.client
				);
			},

			resolveId: {
				filter: {
					id: new RegExp(`^(${MODULE_DEV_CSS}|${MODULE_DEV_CSS_PREFIX}.*)$`),
				},
				handler(id) {
					if (id === MODULE_DEV_CSS) {
						return RESOLVED_MODULE_DEV_CSS;
					}
					return RESOLVED_MODULE_DEV_CSS_PREFIX + id.slice(MODULE_DEV_CSS_PREFIX.length);
				},
			},

			load: {
				filter: {
					id: new RegExp(`^(${RESOLVED_MODULE_DEV_CSS}|${RESOLVED_MODULE_DEV_CSS_PREFIX}.*)$`),
				},
				async handler(id) {
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
						await ssrEnvironment?.fetchModule(componentPageId);
						const resolved = await ssrEnvironment?.pluginContainer.resolveId(componentPageId);

						if (!resolved?.id) {
							return {
								code: 'export const css = new Set()',
							};
						}

						// the vite.EnvironmentModuleNode has all of the info we need
						const mod = ssrEnvironment?.moduleGraph.getModuleById(resolved.id);

						if (!mod) {
							return {
								code: 'export const css = new Set()',
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
						const cleanedCss = cssArray.map(({ content, id: cssId, url }) => ({
							content,
							id: cssId,
							url,
						}));
						return {
							code: `export const css = new Set(${JSON.stringify(cleanedCss)})`,
						};
					}
				},
			},

			transform: {
				filter: {
					id: {
						include: [CSS_LANGS_RE],
						exclude: [rawRE, inlineRE],
					},
				},
				handler(code, id) {
					if (command === 'build') {
						return;
					}

					// Cache CSS content as we see it
					const mod = ssrEnvironment?.moduleGraph.getModuleById(id);
					if (mod) {
						cssContentCache.set(id, code);
					}
				},
			},
		},
		{
			name: MODULE_DEV_CSS_ALL,
			applyToEnvironment(env) {
				// This should only run in dev mode so `prerender` is excluded.
				return (
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro
				);
			},
			resolveId: {
				filter: {
					id: new RegExp(`^${MODULE_DEV_CSS_ALL}$`),
				},
				handler() {
					return RESOLVED_MODULE_DEV_CSS_ALL;
				},
			},
			load: {
				filter: {
					id: new RegExp(`^${RESOLVED_MODULE_DEV_CSS_ALL}$`),
				},
				handler() {
					// Creates a map of the component name to a function to import it
					let code = `export const devCSSMap = new Map([`;
					for (const route of routesList.routes) {
						code += `\n\t[${JSON.stringify(route.component)}, () => import(${JSON.stringify(getDevCSSModuleName(route.component))})],`;
					}
					code += ']);';
					return {
						code,
					};
				},
			},
		},
	];
}
