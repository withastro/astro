import { prependForwardSlash } from '@astrojs/internal-helpers/path';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { wrapId } from '../core/util.js';
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
function getComponentFromVirtualModuleCssName(virtualModulePrefix, id) {
	return id
		.slice(virtualModulePrefix.length)
		.replace(new RegExp(ASTRO_CSS_EXTENSION_POST_PATTERN, 'g'), '.');
}
async function ensureModulesLoaded(env, mod, seen = /* @__PURE__ */ new Set()) {
	const id = mod.id ?? mod.url;
	if (seen.has(id)) return;
	seen.add(id);
	for (const imp of mod.importedModules) {
		if (!imp.id) continue;
		if (seen.has(imp.id)) continue;
		if (imp.id.includes(PROPAGATED_ASSET_QUERY_PARAM)) continue;
		if (
			imp.id === RESOLVED_MODULE_DEV_CSS ||
			imp.id === RESOLVED_MODULE_DEV_CSS_ALL ||
			imp.id.startsWith(RESOLVED_MODULE_DEV_CSS_PREFIX)
		)
			continue;
		if (!imp.transformResult) {
			try {
				await env.fetchModule(imp.id);
			} catch {}
		}
		await ensureModulesLoaded(env, imp, seen);
	}
}
function* collectCSSWithOrder(id, mod, seen = /* @__PURE__ */ new Set()) {
	seen.add(id);
	if (id.includes(PROPAGATED_ASSET_QUERY_PARAM)) {
		return;
	}
	const imported = Array.from(mod.importedModules);
	if (isBuildableCSSRequest(id)) {
		yield {
			id: wrapId(mod.id ?? mod.url),
			idKey: id,
			content: '',
			url: prependForwardSlash(wrapId(mod.url)),
		};
		return;
	} else if (id.endsWith('?raw')) {
		return;
	}
	for (const imp of imported) {
		if (imp.id && !seen.has(imp?.id)) {
			yield* collectCSSWithOrder(imp.id, imp, seen);
		}
	}
}
function astroDevCssPlugin({ routesList, command }) {
	let server;
	const cssContentCache = /* @__PURE__ */ new Map();
	function getCurrentEnvironment(pluginEnv) {
		return pluginEnv ?? server?.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
	}
	return [
		{
			name: MODULE_DEV_CSS,
			async configureServer(viteServer) {
				server = viteServer;
			},
			applyToEnvironment(env) {
				return (
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
						const cssWithOrder = /* @__PURE__ */ new Map();
						const componentPageId = getVirtualModulePageNameForComponent(componentPath);
						const env = getCurrentEnvironment(this.environment);
						await env?.fetchModule(componentPageId);
						const resolved = await env?.pluginContainer.resolveId(componentPageId);
						if (!resolved?.id) {
							return {
								code: 'export const css = new Set()',
							};
						}
						const mod = env?.moduleGraph.getModuleById(resolved.id);
						if (!mod) {
							return {
								code: 'export const css = new Set()',
							};
						}
						if (env) {
							await ensureModulesLoaded(env, mod);
						}
						for (const collected of collectCSSWithOrder(componentPageId, mod)) {
							if (!cssWithOrder.has(collected.idKey)) {
								const content = cssContentCache.get(collected.id) || collected.content;
								cssWithOrder.set(collected.idKey, { ...collected, content });
							}
						}
						const cssArray = Array.from(cssWithOrder.values());
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
					const env = getCurrentEnvironment(this.environment);
					const mod = env?.moduleGraph.getModuleById(id);
					if (mod) {
						cssContentCache.set(id, code);
					}
				},
			},
		},
		{
			name: MODULE_DEV_CSS_ALL,
			applyToEnvironment(env) {
				return (
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
					let code = `export const devCSSMap = new Map([`;
					for (const route of routesList.routes) {
						code += `
	[${JSON.stringify(route.component)}, () => import(${JSON.stringify(getDevCSSModuleName(route.component))})],`;
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
export { astroDevCssPlugin };
