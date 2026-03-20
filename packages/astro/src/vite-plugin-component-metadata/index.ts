import type { DevEnvironment, EnvironmentModuleNode, Plugin, ViteDevServer } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import type { RoutesList } from '../types/astro.js';
import type { SSRComponentMetadata } from '../types/public/internal.js';
import { getAstroMetadata } from '../vite-plugin-astro/index.js';
import { getVirtualModulePageName } from '../vite-plugin-pages/util.js';
import { PROPAGATED_ASSET_QUERY_PARAM } from '../content/consts.js';

const MODULE_PREFIX = 'virtual:astro:dev-component-metadata:';
const RESOLVED_MODULE_PREFIX = '\0' + MODULE_PREFIX;
const MODULE_ALL = 'virtual:astro:dev-component-metadata-all';
const RESOLVED_MODULE_ALL = '\0' + MODULE_ALL;

// Reuse the same extension masking pattern as CSS modules
const EXTENSION_POST_PATTERN = '@_@';

function getMetadataModuleName(componentPath: string): string {
	return getVirtualModulePageName(MODULE_PREFIX, componentPath);
}

function getComponentFromModuleName(id: string): string {
	return id
		.slice(RESOLVED_MODULE_PREFIX.length)
		.replace(new RegExp(EXTENSION_POST_PATTERN, 'g'), '.');
}

/**
 * Walk the module graph starting from a root module to collect component metadata.
 * Unlike crawlGraph(), this does NOT require a RunnableDevEnvironment because it
 * never calls runner.import(). It only reads the existing module graph structure.
 */
function collectComponentMetadata(
	env: DevEnvironment,
	rootId: string,
): Map<string, SSRComponentMetadata> {
	const map = new Map<string, SSRComponentMetadata>();

	// Get the page virtual module to start from
	const rootMod = env.moduleGraph.getModuleById(rootId);
	if (!rootMod) return map;

	const seen = new Set<string>();

	function walk(mod: EnvironmentModuleNode) {
		const id = mod.id ?? mod.url;
		if (seen.has(id)) return;
		seen.add(id);

		// Read module info and extract astro metadata
		if (mod.id) {
			const modInfo = env.pluginContainer.getModuleInfo(mod.id);
			if (modInfo) {
				const astro = getAstroMetadata(modInfo as { id: string; meta?: Record<string, any> });
				if (astro) {
					const metadata: SSRComponentMetadata = {
						containsHead: false,
						propagation: 'none',
					};
					if (astro.propagation) {
						metadata.propagation = astro.propagation;
					}
					if (astro.containsHead) {
						metadata.containsHead = astro.containsHead;
					}
					map.set(modInfo.id, metadata);
				}
			}
		}

		// Walk imported modules, stopping at propagation boundaries
		for (const imp of mod.importedModules) {
			if (!imp.id) continue;
			if (seen.has(imp.id)) continue;
			// Stop at propagated asset boundaries (same as crawlGraph)
			if (imp.id.includes(PROPAGATED_ASSET_QUERY_PARAM)) continue;
			walk(imp);
		}
	}

	walk(rootMod);
	return map;
}

/**
 * Vite plugin that provides component metadata (propagation hints, containsHead)
 * via virtual modules. This is used by NonRunnablePipeline to get the same metadata
 * that RunnablePipeline gets via getComponentMetadata().
 *
 * The plugin creates:
 * - Per-route modules: virtual:astro:dev-component-metadata:{route}
 * - A map module: virtual:astro:dev-component-metadata-all
 */
export function astroDevComponentMetadataPlugin({
	routesList,
}: {
	routesList: RoutesList;
}): Plugin[] {
	let server: ViteDevServer | undefined;

	function getSSREnvironment(): DevEnvironment | undefined {
		return server?.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr] as DevEnvironment | undefined;
	}

	return [
		{
			name: 'astro:dev-component-metadata',
			apply: 'serve',
			applyToEnvironment(env) {
				return (
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
					env.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
				);
			},
			configureServer(viteServer) {
				server = viteServer;
			},
			resolveId: {
				filter: {
					id: new RegExp(
						`^(${MODULE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*|${MODULE_ALL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`,
					),
				},
				handler(id) {
					if (id === MODULE_ALL) {
						return RESOLVED_MODULE_ALL;
					}
					if (id.startsWith(MODULE_PREFIX)) {
						return RESOLVED_MODULE_PREFIX + id.slice(MODULE_PREFIX.length);
					}
				},
			},
			load: {
				filter: {
					id: new RegExp(
						`^(${RESOLVED_MODULE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*|${RESOLVED_MODULE_ALL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`,
					),
				},
				handler(id) {
					if (id === RESOLVED_MODULE_ALL) {
						let code = `export const devComponentMetadataMap = new Map([`;
						for (const route of routesList.routes) {
							code += `\n\t[${JSON.stringify(route.component)}, () => import(${JSON.stringify(getMetadataModuleName(route.component))})],`;
						}
						code += ']);';
						return { code };
					}

					if (id.startsWith(RESOLVED_MODULE_PREFIX)) {
						const componentPath = getComponentFromModuleName(id);
						const env = getSSREnvironment();

						if (!env) {
							return {
								code: `export const metadata = new Map();`,
							};
						}

						// Get the page module from the SSR environment's module graph
						const pageVirtualModuleName = getVirtualModulePageName(
							'virtual:astro:page:',
							componentPath,
						);
						const resolvedPageId = '\0' + pageVirtualModuleName;
						const metadata = collectComponentMetadata(env, resolvedPageId);

						// Serialize the Map as JSON entries
						const entries = Array.from(metadata.entries()).map(([key, value]) => [key, value]);
						return {
							code: `export const metadata = new Map(${JSON.stringify(entries)});`,
						};
					}
				},
			},
		},
	];
}
