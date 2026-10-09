import type { Plugin as VitePlugin } from 'vite';
import type { AstroAdapter } from '../../../types/public/index.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

type LegacyAdapter = Extract<AstroAdapter, { entrypointResolution?: 'explicit' }>;

export function isLegacyAdapter(adapter: AstroAdapter): adapter is LegacyAdapter {
	return adapter.entrypointResolution === undefined || adapter.entrypointResolution === 'explicit';
}

export const LEGACY_SSR_ENTRY_VIRTUAL_MODULE = 'virtual:astro:legacy-ssr-entry';
export const RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE = '\0' + LEGACY_SSR_ENTRY_VIRTUAL_MODULE;

const ADAPTER_VIRTUAL_MODULE_ID = 'virtual:astro:adapter-entrypoint';
const RESOLVED_ADAPTER_VIRTUAL_MODULE_ID = '\0' + ADAPTER_VIRTUAL_MODULE_ID;

const ADAPTER_CONFIG_VIRTUAL_MODULE_ID = 'virtual:astro:adapter-config';
const RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID = '\0' + ADAPTER_CONFIG_VIRTUAL_MODULE_ID;

function vitePluginAdapter(adapter: LegacyAdapter): VitePlugin {
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

/**
 * Vite plugin that exposes adapter configuration as a virtual module.
 * Makes adapter config (args, exports, features, entrypoint) available at runtime
 * so the adapter can access its own configuration during SSR.
 */
function vitePluginAdapterConfig(adapter: LegacyAdapter): VitePlugin {
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

function vitePluginSSR(internals: BuildInternals, adapter: LegacyAdapter): VitePlugin {
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
				const exports: string[] = [];

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
					code: `import _exports from 'astro/entrypoints/legacy';\n${exports.join('\n')}`,
				};
			},
		},
		async generateBundle(_opts, bundle) {
			// Add assets from this SSR chunk as well.
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}
		},
	};
}

export function pluginSSR(options: StaticBuildOptions, internals: BuildInternals): VitePlugin[] {
	const adapter = options.settings.adapter;
	const ssr = options.settings.buildOutput === 'server';

	const plugins: VitePlugin[] = [];

	if (adapter && isLegacyAdapter(adapter)) {
		plugins.push(vitePluginAdapter(adapter), vitePluginAdapterConfig(adapter));

		if (ssr) {
			plugins.unshift(vitePluginSSR(internals, adapter));
		}
	}

	return plugins;
}
