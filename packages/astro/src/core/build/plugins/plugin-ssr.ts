import type { Plugin as VitePlugin } from 'vite';
import type { AstroAdapter } from '../../../types/public/index.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

const SSR_VIRTUAL_MODULE_ID = 'virtual:astro:legacy-ssr-entry';
export const RESOLVED_SSR_VIRTUAL_MODULE_ID = '\0' + SSR_VIRTUAL_MODULE_ID;

const ADAPTER_VIRTUAL_MODULE_ID = 'virtual:astro:adapter-entrypoint';
const RESOLVED_ADAPTER_VIRTUAL_MODULE_ID = '\0' + ADAPTER_VIRTUAL_MODULE_ID;

const ADAPTER_CONFIG_VIRTUAL_MODULE_ID = 'virtual:astro:adapter-config';
const RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID = '\0' + ADAPTER_CONFIG_VIRTUAL_MODULE_ID;

function vitePluginAdapter(adapter: AstroAdapter): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-adapter',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},
		resolveId(id) {
			if (id === ADAPTER_VIRTUAL_MODULE_ID) {
				return RESOLVED_ADAPTER_VIRTUAL_MODULE_ID;
			}
		},
		async load(id) {
			if (id === RESOLVED_ADAPTER_VIRTUAL_MODULE_ID) {
				const adapterEntrypointStr = JSON.stringify(adapter.serverEntrypoint);
				return {
					code: `export * from ${adapterEntrypointStr};
import * as _serverEntrypoint from ${adapterEntrypointStr};
export default _serverEntrypoint.default;`,
				};
			}
		},
	};
}

/**
 * Vite plugin that exposes adapter configuration as a virtual module.
 * Makes adapter config (args, exports, features, entrypoint) available at runtime
 * so the adapter can access its own configuration during SSR.
 */
function vitePluginAdapterConfig(adapter: AstroAdapter): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-adapter-config',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},
		resolveId(id) {
			if (id === ADAPTER_CONFIG_VIRTUAL_MODULE_ID) {
				return RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_ADAPTER_CONFIG_VIRTUAL_MODULE_ID) {
				return {
					code: `export const args = ${adapter.args ? JSON.stringify(adapter.args, null, 2) : 'undefined'};
export const exports = ${adapter.exports ? JSON.stringify(adapter.exports) : 'undefined'};
export const adapterFeatures = ${adapter.adapterFeatures ? JSON.stringify(adapter.adapterFeatures, null, 2) : 'undefined'};
export const serverEntrypoint = ${JSON.stringify(adapter.serverEntrypoint)};`,
				};
			}
		},
	};
}

function vitePluginSSR(
	internals: BuildInternals,
	adapter: AstroAdapter,
	_options: StaticBuildOptions,
): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr-server',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},
		resolveId(id) {
			if (id === SSR_VIRTUAL_MODULE_ID) {
				return RESOLVED_SSR_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_SSR_VIRTUAL_MODULE_ID) {
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
			}
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

export function pluginSSR(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin[] {
	// We check before this point if there's an adapter, so we can safely assume it exists here.
	const adapter = options.settings.adapter!;
	const ssr = options.settings.buildOutput === 'server';

	const plugins: VitePlugin[] = [vitePluginAdapter(adapter), vitePluginAdapterConfig(adapter)];

	if (ssr) {
		plugins.unshift(vitePluginSSR(internals, adapter, options));
	}

	return plugins;
}

