import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroAdapter, AstroSettings } from '../../../@types/astro.js';
import { isFunctionPerRouteEnabled } from '../../../integrations/hooks.js';
import { routeIsRedirect } from '../../redirects/index.js';
import { VIRTUAL_ISLAND_MAP_ID } from '../../server-islands/vite-plugin-server-islands.js';
import { isServerLikeOutput } from '../../util.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
import { SSR_MANIFEST_VIRTUAL_MODULE_ID } from './plugin-manifest.js';
import { MIDDLEWARE_MODULE_ID } from './plugin-middleware.js';
import { ASTRO_PAGE_MODULE_ID } from './plugin-pages.js';
import { RENDERERS_MODULE_ID } from './plugin-renderers.js';
import { getComponentFromVirtualModulePageName, getVirtualModulePageName } from './util.js';

export const SSR_VIRTUAL_MODULE_ID = '@astrojs-ssr-virtual-entry';
export const RESOLVED_SSR_VIRTUAL_MODULE_ID = '\0' + SSR_VIRTUAL_MODULE_ID;

const ADAPTER_VIRTUAL_MODULE_ID = '@astrojs-ssr-adapter';
const RESOLVED_ADAPTER_VIRTUAL_MODULE_ID = '\0' + ADAPTER_VIRTUAL_MODULE_ID;

function vitePluginAdapter(adapter: AstroAdapter): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-adapter',
		enforce: 'post',
		resolveId(id) {
			if (id === ADAPTER_VIRTUAL_MODULE_ID) {
				return RESOLVED_ADAPTER_VIRTUAL_MODULE_ID;
			}
		},
		async load(id) {
			if (id === RESOLVED_ADAPTER_VIRTUAL_MODULE_ID) {
				return `export * from '${adapter.serverEntrypoint}';`;
			}
		},
	};
}

function vitePluginSSR(
	internals: BuildInternals,
	adapter: AstroAdapter,
	options: StaticBuildOptions,
): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr-server',
		enforce: 'post',
		options(opts) {
			const inputs = new Set<string>();

			for (const pageData of Object.values(options.allPages)) {
				if (routeIsRedirect(pageData.route)) {
					continue;
				}
				inputs.add(getVirtualModulePageName(ASTRO_PAGE_MODULE_ID, pageData.component));
			}

			const adapterServerEntrypoint = options.settings.adapter?.serverEntrypoint;
			if (adapterServerEntrypoint) {
				inputs.add(ADAPTER_VIRTUAL_MODULE_ID);
			}

			inputs.add(SSR_VIRTUAL_MODULE_ID);
			return addRollupInput(opts, Array.from(inputs));
		},
		resolveId(id) {
			if (id === SSR_VIRTUAL_MODULE_ID) {
				return RESOLVED_SSR_VIRTUAL_MODULE_ID;
			}
		},
		async load(id) {
			if (id === RESOLVED_SSR_VIRTUAL_MODULE_ID) {
				const { allPages } = options;
				const imports: string[] = [];
				const contents: string[] = [];
				const exports: string[] = [];
				let i = 0;
				const pageMap: string[] = [];

				for (const pageData of Object.values(allPages)) {
					if (routeIsRedirect(pageData.route)) {
						continue;
					}
					const virtualModuleName = getVirtualModulePageName(
						ASTRO_PAGE_MODULE_ID,
						pageData.component,
					);
					let module = await this.resolve(virtualModuleName);
					if (module) {
						const variable = `_page${i}`;
						// we need to use the non-resolved ID in order to resolve correctly the virtual module
						imports.push(`const ${variable} = () => import("${virtualModuleName}");`);

						const pageData2 = internals.pagesByKeys.get(pageData.key);
						if (pageData2) {
							pageMap.push(`[${JSON.stringify(pageData2.component)}, ${variable}]`);
						}
						i++;
					}
				}
				contents.push(`const pageMap = new Map([\n    ${pageMap.join(',\n    ')}\n]);`);
				exports.push(`export { pageMap }`);
				const middleware = await this.resolve(MIDDLEWARE_MODULE_ID);
				const ssrCode = generateSSRCode(options.settings, adapter, middleware!.id);
				imports.push(...ssrCode.imports);
				contents.push(...ssrCode.contents);
				return [...imports, ...contents, ...exports].join('\n');
			}
		},
		async generateBundle(_opts, bundle) {
			// Add assets from this SSR chunk as well.
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}

			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.modules[RESOLVED_SSR_VIRTUAL_MODULE_ID]) {
					internals.ssrEntryChunk = chunk;
				}
			}
		},
	};
}

export function pluginSSR(
	options: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	const ssr = isServerLikeOutput(options.settings.config);
	const functionPerRouteEnabled = isFunctionPerRouteEnabled(options.settings.adapter);
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				const adapter = options.settings.adapter!;
				let ssrPlugin =
					ssr && functionPerRouteEnabled === false
						? vitePluginSSR(internals, adapter, options)
						: undefined;
				const vitePlugin = [vitePluginAdapter(adapter)];
				if (ssrPlugin) {
					vitePlugin.unshift(ssrPlugin);
				}

				return {
					enforce: 'after-user-plugins',
					vitePlugin: vitePlugin,
				};
			},
			'build:post': async () => {
				if (!ssr) {
					return;
				}

				if (functionPerRouteEnabled) {
					return;
				}

				if (!internals.ssrEntryChunk) {
					throw new Error(`Did not generate an entry chunk for SSR`);
				}
				// Mutate the filename
				internals.ssrEntryChunk.fileName = options.settings.config.build.serverEntry;
			},
		},
	};
}

export const SPLIT_MODULE_ID = '@astro-page-split:';
export const RESOLVED_SPLIT_MODULE_ID = '\0@astro-page-split:';

function vitePluginSSRSplit(
	internals: BuildInternals,
	adapter: AstroAdapter,
	options: StaticBuildOptions,
): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr-split',
		enforce: 'post',
		options(opts) {
			const inputs = new Set<string>();

			for (const pageData of Object.values(options.allPages)) {
				if (routeIsRedirect(pageData.route)) {
					continue;
				}
				inputs.add(getVirtualModulePageName(SPLIT_MODULE_ID, pageData.component));
			}

			return addRollupInput(opts, Array.from(inputs));
		},
		resolveId(id) {
			if (id.startsWith(SPLIT_MODULE_ID)) {
				return '\0' + id;
			}
		},
		async load(id) {
			if (id.startsWith(RESOLVED_SPLIT_MODULE_ID)) {
				const imports: string[] = [];
				const contents: string[] = [];
				const exports: string[] = [];
				const componentPath = getComponentFromVirtualModulePageName(RESOLVED_SPLIT_MODULE_ID, id);
				const virtualModuleName = getVirtualModulePageName(ASTRO_PAGE_MODULE_ID, componentPath);
				let module = await this.resolve(virtualModuleName);
				if (module) {
					// we need to use the non-resolved ID in order to resolve correctly the virtual module
					imports.push(`import * as pageModule from "${virtualModuleName}";`);
				}
				const middleware = await this.resolve(MIDDLEWARE_MODULE_ID);
				const ssrCode = generateSSRCode(options.settings, adapter, middleware!.id);
				imports.push(...ssrCode.imports);
				contents.push(...ssrCode.contents);

				exports.push('export { pageModule }');

				return [...imports, ...contents, ...exports].join('\n');
			}
		},
		async generateBundle(_opts, bundle) {
			// Add assets from this SSR chunk as well.
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}

			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				for (const moduleKey of Object.keys(chunk.modules)) {
					if (moduleKey.startsWith(RESOLVED_SPLIT_MODULE_ID)) {
						storeEntryPoint(moduleKey, options, internals, chunk.fileName);
					}
				}
			}
		},
	};
}

export function pluginSSRSplit(
	options: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	const ssr = isServerLikeOutput(options.settings.config);
	const functionPerRouteEnabled = isFunctionPerRouteEnabled(options.settings.adapter);

	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				const adapter = options.settings.adapter!;
				let ssrPlugin =
					ssr && functionPerRouteEnabled
						? vitePluginSSRSplit(internals, adapter, options)
						: undefined;
				const vitePlugin = [vitePluginAdapter(adapter)];
				if (ssrPlugin) {
					vitePlugin.unshift(ssrPlugin);
				}

				return {
					enforce: 'after-user-plugins',
					vitePlugin,
				};
			},
		},
	};
}

function generateSSRCode(settings: AstroSettings, adapter: AstroAdapter, middlewareId: string) {
	const edgeMiddleware = adapter?.adapterFeatures?.edgeMiddleware ?? false;
	const pageMap = isFunctionPerRouteEnabled(adapter) ? 'pageModule' : 'pageMap';

	const imports = [
		`import { renderers } from '${RENDERERS_MODULE_ID}';`,
		`import * as serverEntrypointModule from '${ADAPTER_VIRTUAL_MODULE_ID}';`,
		`import { manifest as defaultManifest } from '${SSR_MANIFEST_VIRTUAL_MODULE_ID}';`,
		settings.config.experimental.serverIslands
			? `import { serverIslandMap } from '${VIRTUAL_ISLAND_MAP_ID}';`
			: '',
	];

	const contents = [
		settings.config.experimental.serverIslands ? '' : `const serverIslandMap = new Map()`,
		`const _manifest = Object.assign(defaultManifest, {`,
		`    ${pageMap},`,
		`    serverIslandMap,`,
		`    renderers,`,
		`    middleware: ${edgeMiddleware ? 'undefined' : `() => import("${middlewareId}")`}`,
		`});`,
		`const _args = ${adapter.args ? JSON.stringify(adapter.args, null, 4) : 'undefined'};`,
		adapter.exports
			? `const _exports = serverEntrypointModule.createExports(_manifest, _args);`
			: '',
		...(adapter.exports?.map((name) => {
			if (name === 'default') {
				return `export default _exports.default;`;
			} else {
				return `export const ${name} = _exports['${name}'];`;
			}
		}) ?? []),
		// NOTE: This is intentionally obfuscated!
		// Do NOT simplify this to something like `serverEntrypointModule.start?.(_manifest, _args)`
		// They are NOT equivalent! Some bundlers will throw if `start` is not exported, but we
		// only want to silently ignore it... hence the dynamic, obfuscated weirdness.
		`const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}`,
	];

	return {
		imports,
		contents,
	};
}

/**
 * Because we delete the bundle from rollup at the end of this function,
 *  we can't use `writeBundle` hook to get the final file name of the entry point written on disk.
 *  We use this hook instead.
 *
 *  We retrieve all the {@link RouteData} that have the same component as the one we are processing.
 */
function storeEntryPoint(
	moduleKey: string,
	options: StaticBuildOptions,
	internals: BuildInternals,
	fileName: string,
) {
	const componentPath = getComponentFromVirtualModulePageName(RESOLVED_SPLIT_MODULE_ID, moduleKey);
	for (const pageData of Object.values(options.allPages)) {
		if (componentPath == pageData.component) {
			const publicPath = fileURLToPath(options.settings.config.build.server);
			internals.entryPoints.set(pageData.route, pathToFileURL(join(publicPath, fileName)));
		}
	}
}
