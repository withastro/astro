import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
function isLegacyAdapter(adapter) {
	return adapter.entrypointResolution === void 0 || adapter.entrypointResolution === 'explicit';
}
const LEGACY_SSR_ENTRY_VIRTUAL_MODULE = 'virtual:astro:legacy-ssr-entry';
const RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE = '\0' + LEGACY_SSR_ENTRY_VIRTUAL_MODULE;
const ADAPTER_VIRTUAL_MODULE_ID = 'virtual:astro:adapter-entrypoint';
const RESOLVED_ADAPTER_VIRTUAL_MODULE_ID = '\0' + ADAPTER_VIRTUAL_MODULE_ID;
const ADAPTER_CONFIG_VIRTUAL_MODULE_ID = 'virtual:astro:adapter-config';
const RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID = '\0' + ADAPTER_CONFIG_VIRTUAL_MODULE_ID;
function vitePluginAdapter(adapter) {
	return {
		name: '@astrojs/vite-plugin-astro-adapter',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${ADAPTER_VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_ADAPTER_VIRTUAL_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_ADAPTER_VIRTUAL_MODULE_ID}$`),
			},
			async handler() {
				const adapterEntrypointStr = JSON.stringify(adapter.serverEntrypoint);
				return {
					code: `export * from ${adapterEntrypointStr};
import * as _serverEntrypoint from ${adapterEntrypointStr};
export default _serverEntrypoint.default;`,
				};
			},
		},
	};
}
function vitePluginAdapterConfig(adapter) {
	return {
		name: '@astrojs/vite-plugin-astro-adapter-config',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${ADAPTER_CONFIG_VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				return {
					code: `export const args = ${adapter.args ? JSON.stringify(adapter.args, null, 2) : 'undefined'};`,
				};
			},
		},
	};
}
function vitePluginSSR(internals, adapter) {
	return {
		name: '@astrojs/vite-plugin-astro-ssr-server',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${LEGACY_SSR_ENTRY_VIRTUAL_MODULE}$`),
			},
			handler() {
				return RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE}$`),
			},
			handler() {
				const exports = [];
				if (adapter.exports) {
					exports.push(
						...(adapter.exports?.map((name) => {
							if (name === 'default') {
								return `export default _exports.default;`;
							} else {
								return `export const ${name} = _exports['${name}'];`;
							}
						}) ?? []),
					);
				}
				return {
					code: `import _exports from 'astro/entrypoints/legacy';
${exports.join('\n')}`,
				};
			},
		},
		async generateBundle(_opts, bundle) {
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}
		},
	};
}
function pluginSSR(options, internals) {
	const adapter = options.settings.adapter;
	const ssr = options.settings.buildOutput === 'server';
	const plugins = [];
	if (adapter && isLegacyAdapter(adapter)) {
		plugins.push(vitePluginAdapter(adapter), vitePluginAdapterConfig(adapter));
		if (ssr) {
			plugins.unshift(vitePluginSSR(internals, adapter));
		}
	}
	return plugins;
}
export {
	LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
	RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
	isLegacyAdapter,
	pluginSSR,
};
