import type * as vite from 'vite';
import type { DevEnvironment, Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import type { ImportedDevStyle, RoutesList } from '../types/astro.js';
import { inlineRE, rawRE } from '../vite-plugin-astro-server/util.js';
import { getVirtualModulePageNameForComponent } from '../vite-plugin-pages/util.js';
import { getDevCSSModuleName } from './util.js';
import {
	collectCSSWithOrder,
	ensureModulesLoaded,
} from '@astrojs/vite-plugin-astro/internal/vite-plugin-css/collect.js';
import { CSS_LANGS_RE } from '../core/viteUtils.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { RESOLVED_SERVER_ISLAND_MANIFEST } from '../core/server-islands/vite-plugin-server-islands.js';
import {
	ASTRO_CSS_EXTENSION_POST_PATTERN,
	MODULE_DEV_CSS,
	MODULE_DEV_CSS_ALL,
	MODULE_DEV_CSS_PREFIX,
	RESOLVED_MODULE_DEV_CSS,
	RESOLVED_MODULE_DEV_CSS_ALL,
	RESOLVED_MODULE_DEV_CSS_PREFIX,
} from '@astrojs/vite-plugin-astro/internal/vite-plugin-css/const.js';

// Stop at page virtual module boundaries. When a page imports something that transitively pulls in
// virtual:astro:pages (e.g. via astro:config/server → virtual:astro:manifest), the walk would
// otherwise descend into every other page's module graph, fetching their CSS dependencies. This is
// the dev-mode counterpart of isBuildCssBoundary in plugin-css.ts. See #18060, #16116.
function isPageModuleBoundary(id: string): boolean {
	return id.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID);
}

// Skip the server island manifest. The server islands plugin refreshes it by clearing its
// transformResult so the module runner's next import re-transforms it and drops its stale
// copy. Fetching it here would repopulate transformResult first, so Vite would answer the
// runner with `cache: true` and it would keep an island map missing newly discovered
// islands. The manifest contains no CSS. See #18387.
function isModuleLoadBoundary(id: string): boolean {
	return isPageModuleBoundary(id) || id === RESOLVED_SERVER_ISLAND_MANIFEST;
}

interface AstroVitePluginOptions {
	routesList: RoutesList;
	command: 'dev' | 'build';
	/** Shared cache of CSS content by module ID. Populated by the transform hook and
	 *  consumed by the content asset propagation plugin to avoid re-processing CSS
	 *  modules with `?inline` (which can produce different scoped-name hashes with
	 *  Lightning CSS). */
	cssContentCache: Map<string, string>;
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
 * This plugin tracks the CSS that should be applied by route.
 *
 * The virtual module should be used only during development.
 * Per-route virtual modules are created to avoid invalidation loops.
 *
 * The second plugin imports all of the individual CSS modules in a map.
 *
 * @param routesList
 */
export function astroDevCssPlugin({
	routesList,
	command,
	cssContentCache,
}: AstroVitePluginOptions): Plugin[] {
	let server: vite.ViteDevServer | undefined;

	function getCurrentEnvironment(pluginEnv?: DevEnvironment): DevEnvironment | undefined {
		return (
			pluginEnv ??
			(server?.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr] as DevEnvironment | undefined)
		);
	}

	return [
		{
			name: MODULE_DEV_CSS,

			async configureServer(viteServer) {
				server = viteServer;
			},
			applyToEnvironment(env) {
				return (
					(command === 'dev' && env.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro) ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
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

						const env = getCurrentEnvironment(this.environment as DevEnvironment);

						// Ensure the page module is loaded. This will populate the graph and allow us to walk through.
						await env?.fetchModule(componentPageId);
						const resolved = await env?.pluginContainer.resolveId(componentPageId);

						if (!resolved?.id) {
							return {
								code: 'export const css = new Set()',
							};
						}

						// the vite.EnvironmentModuleNode has all of the info we need
						const mod = env?.moduleGraph.getModuleById(resolved.id);

						if (!mod) {
							return {
								code: 'export const css = new Set()',
							};
						}

						// Ensure all reachable modules have been transformed.
						// Dynamically imported components may be in the graph (detected by Vite's
						// import analysis) but not yet transformed, so their own CSS imports would
						// be invisible during the graph walk. This eagerly fetches them.
						if (env) {
							await ensureModulesLoaded(env, mod, { isBoundary: isModuleLoadBoundary });
						}

						// Walk through the graph depth-first
						for (const collected of collectCSSWithOrder(componentPageId, mod, {
							isBoundary: isPageModuleBoundary,
						})) {
							// Use the CSS file ID as the key to deduplicate while keeping best ordering
							if (!cssWithOrder.has(collected.idKey)) {
								// Look up actual content from cache if available.
								// Use `idKey` (the raw module ID) for cache lookup because that matches the key
								// used by the transform hook. `collected.id` is wrapped via `wrapId()` which
								// transforms the `\0` prefix of virtual modules, causing a cache miss.
								const content = cssContentCache.get(collected.idKey) || collected.content;
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
		},
		{
			name: MODULE_DEV_CSS_ALL,
			applyToEnvironment(env) {
				return (
					(command === 'dev' && env.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro) ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
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

/**
 * Caches the final CSS of each module in `cssContentCache` during dev, so it can be inlined
 * into server-rendered HTML.
 *
 * Must be registered after all integration and user plugins: its normal-order `transform` then
 * runs after framework transforms (e.g. `@vitejs/plugin-vue` scoping SFC styles) and before
 * `vite:css-post` turns the CSS into JS. See #18333.
 */
export function astroDevCssContentCachePlugin({
	cssContentCache,
}: Pick<AstroVitePluginOptions, 'cssContentCache'>): Plugin {
	return {
		name: 'astro:dev-css-content-cache',
		applyToEnvironment(env) {
			return (
				env.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				env.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				env.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				env.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		transform: {
			filter: {
				id: {
					include: [CSS_LANGS_RE],
					exclude: [rawRE, inlineRE],
				},
			},
			handler(code, id) {
				const mod = (this.environment as DevEnvironment).moduleGraph.getModuleById(id);
				if (mod) {
					cssContentCache.set(id, code);
				}
			},
		},
	};
}
