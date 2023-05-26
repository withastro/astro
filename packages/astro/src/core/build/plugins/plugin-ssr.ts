import glob from 'fast-glob';
import { fileURLToPath } from 'url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroAdapter, AstroConfig } from '../../../@types/astro';
import { runHookBuildSsr } from '../../../integrations/index.js';
import { isServerLikeOutput } from '../../../prerender/utils.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import type { SerializedRouteInfo, SerializedSSRManifest } from '../../app/types';
import { joinPaths, prependForwardSlash } from '../../path.js';
import { routeIsRedirect } from '../../redirects/index.js';
import { serializeRouteData } from '../../routing/index.js';
import { addRollupInput } from '../add-rollup-input.js';
import { getOutFile, getOutFolder } from '../common.js';
import { cssOrder, mergeInlineCss, type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';
import { getVirtualModulePageNameFromPath } from './plugin-pages.js';
import type { OutputChunk, StaticBuildOptions } from '../types';
import { MIDDLEWARE_MODULE_ID } from './plugin-middleware.js';
import { getPathFromVirtualModulePageName, getVirtualModulePageNameFromPath } from './util.js';
import { RENDERERS_MODULE_ID } from './plugin-renderers.js';
import { ASTRO_PAGE_MODULE_ID } from './plugin-pages.js';

export const SSR_VIRTUAL_MODULE_ID = '@astrojs-ssr-virtual-entry';
const RESOLVED_SSR_VIRTUAL_MODULE_ID = '\0' + SSR_VIRTUAL_MODULE_ID;
const manifestReplace = '@@ASTRO_MANIFEST_REPLACE@@';
const replaceExp = new RegExp(`['"](${manifestReplace})['"]`, 'g');

function vitePluginSSRServer(
	internals: BuildInternals,
	adapter: AstroAdapter,
	options: StaticBuildOptions
): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr-server',
		enforce: 'post',
		options(opts) {
			return addRollupInput(opts, [SSR_VIRTUAL_MODULE_ID]);
		},
		resolveId(id) {
			if (id === SSR_VIRTUAL_MODULE_ID) {
				return RESOLVED_SSR_VIRTUAL_MODULE_ID;
			}
		},
		async load(id) {
			if (id === RESOLVED_SSR_VIRTUAL_MODULE_ID) {
				const {
					settings: { config },
					allPages,
				} = options;
				const imports: string[] = [];
				const contents: string[] = [];
				const exports: string[] = [];
				let i = 0;
				const pageMap: string[] = [];

				for (const [path, pageData] of Object.entries(allPages)) {
					if (routeIsRedirect(pageData.route)) {
						continue;
					}
					const virtualModuleName = getVirtualModulePageNameFromPath(ASTRO_PAGE_MODULE_ID, path);
					let module = await this.resolve(virtualModuleName);
					if (module) {
						const variable = `_page${i}`;
						// we need to use the non-resolved ID in order to resolve correctly the virtual module
						imports.push(`const ${variable}  = () => import("${virtualModuleName}");`);

						const pageData2 = internals.pagesByComponent.get(path);
						if (pageData2) {
							pageMap.push(`[${JSON.stringify(pageData2.component)}, ${variable}]`);
						}
						i++;
					}
				}

				contents.push(`const pageMap = new Map([${pageMap.join(',')}]);`);
				exports.push(`export { pageMap }`);
				const ssrCode = generateSSRCode(options.settings.config, adapter);
				imports.push(...ssrCode.imports);
				contents.push(...ssrCode.contents);
				return `${imports.join('\n')}${contents.join('\n')}${exports.join('\n')}`;
			}
			return void 0;
		},
		async generateBundle(_opts, bundle) {
			// Add assets from this SSR chunk as well.
			for (const [_chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}

			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.modules[RESOLVED_SSR_VIRTUAL_MODULE_ID]) {
					internals.ssrEntryChunk = chunk;
					delete bundle[chunkName];
				}
			}
		},
	};
}

export function pluginSSRServer(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	const ssr =
		options.settings.config.output === 'server' || isHybridOutput(options.settings.config);
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				let vitePlugin =
					// config.build object is optional, so we check NOT EQUAL against "serverless" instead
					ssr && options.settings.config.build?.mode !== 'serverless'
						? vitePluginSSRServer(internals, options.settings.adapter!, options)
						: undefined;

				return {
					enforce: 'after-user-plugins',
					vitePlugin,
				};
			},
			'build:post': async ({ mutate }) => {
				if (!ssr) {
					return;
				}

				if (options.settings.config.build?.mode === 'serverless') {
					return;
				}

				if (!internals.ssrEntryChunk) {
					throw new Error(`Did not generate an entry chunk for SSR`);
				}
				// Mutate the filename
				internals.ssrEntryChunk.fileName = options.settings.config.build.serverEntry;

				const code = await injectManifest(options, internals, internals.ssrEntryChunk);
				mutate(internals.ssrEntryChunk, 'server', code);
			},
		},
	};
}

export const SERVERLESS_MODULE_ID = '@astro-page-serverless:';
export const RESOLVED_SERVERLESS_MODULE_ID = '\0@astro-page-serverless:';

function vitePluginSSRServerless(
	internals: BuildInternals,
	adapter: AstroAdapter,
	options: StaticBuildOptions
): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr-serverless',
		enforce: 'post',
		options(opts) {
			if (options.settings.config.build?.mode === 'serverless') {
				const inputs: Set<string> = new Set();

				for (const path of Object.keys(options.allPages)) {
					inputs.add(getVirtualModulePageNameFromPath(SERVERLESS_MODULE_ID, path));
				}

				return addRollupInput(opts, Array.from(inputs));
			}
		},
		resolveId(id) {
			if (id.startsWith(SERVERLESS_MODULE_ID)) {
				return '\0' + id;
			}
		},
		async load(id) {
			if (id.startsWith(RESOLVED_SERVERLESS_MODULE_ID)) {
				const {
					settings: { config },
					allPages,
				} = options;
				const imports: string[] = [];
				const contents: string[] = [];
				const exports: string[] = [];

				const path = getPathFromVirtualModulePageName(RESOLVED_SERVERLESS_MODULE_ID, id);
				const virtualModuleName = getVirtualModulePageNameFromPath(ASTRO_PAGE_MODULE_ID, path);
				let module = await this.resolve(virtualModuleName);
				if (module) {
					// we need to use the non-resolved ID in order to resolve correctly the virtual module
					imports.push(`import * as pageModule from "${virtualModuleName}";`);
				}

				const ssrCode = generateSSRCode(options.settings.config, adapter);
				imports.push(...ssrCode.imports);
				contents.push(...ssrCode.contents);

				return `${imports.join('\n')}${contents.join('\n')}${exports.join('\n')}`;
			}
			return void 0;
		},
		async generateBundle(_opts, bundle) {
			// Add assets from this SSR chunk as well.
			for (const [_chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}

			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				let shouldDeleteBundle = false;
				for (const moduleKey of Object.keys(chunk.modules)) {
					if (moduleKey.startsWith(RESOLVED_SERVERLESS_MODULE_ID)) {
						internals.ssrServerlessEntryChunks.set(moduleKey, chunk);
						shouldDeleteBundle = true;
					}
				}
				if (shouldDeleteBundle) {
					delete bundle[chunkName];
				}
				// if (chunk.modules[RESOLVED_SSR_VIRTUAL_MODULE_ID]) {
				// }
			}
		},
	};
}

export function pluginSSRServerless(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	const ssr =
		options.settings.config.output === 'server' || isHybridOutput(options.settings.config);
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				let vitePlugin =
					ssr && options.settings.config.build.mode === 'serverless'
						? vitePluginSSRServerless(internals, options.settings.adapter!, options)
						: undefined;

				return {
					enforce: 'after-user-plugins',
					vitePlugin,
				};
			},
			'build:post': async ({ mutate }) => {
				if (!ssr) {
					return;
				}
				if (options.settings.config.build?.mode === 'server') {
					return;
				}

				if (internals.ssrServerlessEntryChunks.size === 0) {
					throw new Error(`Did not generate an entry chunk for SSR serverless`);
				}
				// TODO: check this commented code
				// Mutate the filename
				// internals.ssrEntryChunk.fileName = options.settings.config.build.serverEntry;

				for (const [moduleName, chunk] of internals.ssrServerlessEntryChunks) {
					const code = await injectManifest(options, internals, chunk);
					mutate(chunk, 'server', code);
				}
			},
		},
	};
}

function generateSSRCode(config: AstroConfig, adapter: AstroAdapter) {
	const imports: string[] = [];
	const contents: string[] = [];
	let middleware;
	if (config.experimental?.middleware === true) {
		imports.push(`import * as _middleware from "${MIDDLEWARE_MODULE_ID}";`);
		middleware = 'middleware: _middleware';
	}
	let pageMap;
	if (config.build.mode === 'serverless') {
		pageMap = 'pageModule';
	} else {
		pageMap = 'pageMap';
	}

	contents.push(`import * as adapter from '${adapter.serverEntrypoint}';
import { renderers } from '${RENDERERS_MODULE_ID}'; 
import { deserializeManifest as _deserializeManifest } from 'astro/app';
import { _privateSetManifestDontUseThis } from 'astro:ssr-manifest';
const _manifest = Object.assign(_deserializeManifest('${manifestReplace}'), {
	${pageMap},
	renderers,
});
_privateSetManifestDontUseThis(_manifest);
const _args = ${adapter.args ? JSON.stringify(adapter.args) : 'undefined'};

${
	adapter.exports
		? `const _exports = adapter.createExports(_manifest, _args);
${adapter.exports
	.map((name) => {
		if (name === 'default') {
			return `const _default = _exports['default'];
export { _default as default };`;
		} else {
			return `export const ${name} = _exports['${name}'];`;
		}
	})
	.join('\n')}
`
		: ''
}
const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest, _args);
}`);
	return {
		imports,
		contents,
	};
}

/**
 * It injects the manifest in the given output rollup chunk. It returns the new emitted code
 * @param buildOpts
 * @param internals
 * @param chunk
 */
export async function injectManifest(
	buildOpts: StaticBuildOptions,
	internals: BuildInternals,
	chunk: Readonly<OutputChunk>
) {
	if (buildOpts.settings.config.build.mode === 'serverless') {
		if (internals.ssrServerlessEntryChunks.size === 0) {
			throw new Error(`Did not generate an entry chunk for SSR in serverless mode`);
		}
	} else {
		if (!internals.ssrEntryChunk) {
			throw new Error(`Did not generate an entry chunk for SSR`);
		}
	}

	// Add assets from the client build.
	const clientStatics = new Set(
		await glob('**/*', {
			cwd: fileURLToPath(buildOpts.buildConfig.client),
		})
	);
	for (const file of clientStatics) {
		internals.staticFiles.add(file);
	}

	const staticFiles = internals.staticFiles;
	const manifest = buildManifest(buildOpts, internals, Array.from(staticFiles));
	await runHookBuildSsr({
		config: buildOpts.settings.config,
		manifest,
		logging: buildOpts.logging,
	});

	const code = chunk.code;

	return code.replace(replaceExp, () => {
		return JSON.stringify(manifest);
	});
}

function buildManifest(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	staticFiles: string[]
): SerializedSSRManifest {
	const { settings } = opts;

	const routes: SerializedRouteInfo[] = [];
	const entryModules = Object.fromEntries(internals.entrySpecifierToBundleMap.entries());
	if (settings.scripts.some((script) => script.stage === 'page')) {
		staticFiles.push(entryModules[PAGE_SCRIPT_ID]);
	}

	const prefixAssetPath = (pth: string) => {
		if (settings.config.build.assetsPrefix) {
			return joinPaths(settings.config.build.assetsPrefix, pth);
		} else {
			return prependForwardSlash(joinPaths(settings.config.base, pth));
		}
	};

	for (const route of opts.manifest.routes) {
		if (!route.prerender) continue;
		if (!route.pathname) continue;

		const outFolder = getOutFolder(opts.settings.config, route.pathname!, route.type);
		const outFile = getOutFile(opts.settings.config, outFolder, route.pathname!, route.type);
		const file = outFile.toString().replace(opts.settings.config.build.client.toString(), '');
		routes.push({
			file,
			links: [],
			scripts: [],
			styles: [],
			routeData: serializeRouteData(route, settings.config.trailingSlash),
		});
		staticFiles.push(file);
	}

	for (const route of opts.manifest.routes) {
		const pageData = internals.pagesByComponent.get(route.component);
		if (route.prerender || !pageData) continue;
		const scripts: SerializedRouteInfo['scripts'] = [];
		if (pageData.hoistedScript) {
			const hoistedValue = pageData.hoistedScript.value;
			const value = hoistedValue.endsWith('.js') ? prefixAssetPath(hoistedValue) : hoistedValue;
			scripts.unshift(
				Object.assign({}, pageData.hoistedScript, {
					value,
				})
			);
		}
		if (settings.scripts.some((script) => script.stage === 'page')) {
			const src = entryModules[PAGE_SCRIPT_ID];

			scripts.push({
				type: 'external',
				value: prefixAssetPath(src),
			});
		}

		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
		const links: [] = [];

		const styles = pageData.styles
			.sort(cssOrder)
			.map(({ sheet }) => sheet)
			.map((s) => (s.type === 'external' ? { ...s, src: prefixAssetPath(s.src) } : s))
			.reduce(mergeInlineCss, []);

		routes.push({
			file: '',
			links,
			scripts: [
				...scripts,
				...settings.scripts
					.filter((script) => script.stage === 'head-inline')
					.map(({ stage, content }) => ({ stage, children: content })),
			],
			styles,
			routeData: serializeRouteData(route, settings.config.trailingSlash),
		});
	}

	// HACK! Patch this special one.
	if (!(BEFORE_HYDRATION_SCRIPT_ID in entryModules)) {
		// Set this to an empty string so that the runtime knows not to try and load this.
		entryModules[BEFORE_HYDRATION_SCRIPT_ID] = '';
	}

	const ssrManifest: SerializedSSRManifest = {
		adapterName: opts.settings.adapter!.name,
		routes,
		site: settings.config.site,
		base: settings.config.base,
		assetsPrefix: settings.config.build.assetsPrefix,
		markdown: settings.config.markdown,
		componentMetadata: Array.from(internals.componentMetadata),
		renderers: [],
		clientDirectives: Array.from(settings.clientDirectives),
		entryModules,
		assets: staticFiles.map(prefixAssetPath),
	};

	return ssrManifest;
}

export function pluginSSR(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	const ssr = isServerLikeOutput(options.settings.config);
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				let vitePlugin = ssr
					? vitePluginSSR(internals, options.settings.adapter!, options)
					: undefined;

				return {
					enforce: 'after-user-plugins',
					vitePlugin,
				};
			},
			'build:post': async ({ mutate }) => {
				if (!ssr) {
					return;
				}

				if (!internals.ssrEntryChunk) {
					throw new Error(`Did not generate an entry chunk for SSR`);
				}
				// Mutate the filename
				internals.ssrEntryChunk.fileName = options.settings.config.build.serverEntry;

				const code = await injectManifest(options, internals);
				mutate(internals.ssrEntryChunk, 'server', code);
			},
		},
	};
}
