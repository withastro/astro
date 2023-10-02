import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { getPageDataByViteID, type BuildInternals } from '../core/build/internal.js';
import type { AstroBuildPlugin } from '../core/build/plugin.js';
import type { StaticBuildOptions } from '../core/build/types.js';
import type { ModuleLoader } from '../core/module-loader/loader.js';
import { createViteLoader } from '../core/module-loader/vite.js';
import { joinPaths, prependForwardSlash } from '../core/path.js';
import { getStylesForURL } from '../vite-plugin-astro-server/css.js';
import { getScriptsForURL } from '../vite-plugin-astro-server/scripts.js';
import {
	CONTENT_RENDER_FLAG,
	LINKS_PLACEHOLDER,
	PROPAGATED_ASSET_FLAG,
	SCRIPTS_PLACEHOLDER,
	STYLES_PLACEHOLDER,
} from './consts.js';
import { hasContentFlag } from './utils.js';

export function astroContentAssetPropagationPlugin({
	mode,
	settings,
}: {
	mode: string;
	settings: AstroSettings;
}): Plugin {
	let devModuleLoader: ModuleLoader;
	return {
		name: 'astro:content-asset-propagation',
		enforce: 'pre',
		async resolveId(id, importer, opts) {
			if (hasContentFlag(id, CONTENT_RENDER_FLAG)) {
				const base = id.split('?')[0];

				for (const { extensions, handlePropagation = true } of settings.contentEntryTypes) {
					if (handlePropagation && extensions.includes(extname(base))) {
						return this.resolve(`${base}?${PROPAGATED_ASSET_FLAG}`, importer, {
							skipSelf: true,
							...opts,
						});
					}
				}
				// Resolve to the base id (no content flags)
				// if Astro doesn't need to handle propagation.
				return this.resolve(base, importer, { skipSelf: true, ...opts });
			}
		},
		configureServer(server) {
			if (mode === 'dev') {
				devModuleLoader = createViteLoader(server);
			}
		},
		async transform(_, id, options) {
			if (hasContentFlag(id, PROPAGATED_ASSET_FLAG)) {
				const basePath = id.split('?')[0];
				let stringifiedLinks: string, stringifiedStyles: string, stringifiedScripts: string;

				// We can access the server in dev,
				// so resolve collected styles and scripts here.
				if (options?.ssr && devModuleLoader) {
					if (!devModuleLoader.getModuleById(basePath)?.ssrModule) {
						await devModuleLoader.import(basePath);
					}
					const { styles, urls } = await getStylesForURL(
						pathToFileURL(basePath),
						devModuleLoader,
						'development'
					);

					const hoistedScripts = await getScriptsForURL(
						pathToFileURL(basePath),
						settings.config.root,
						devModuleLoader
					);

					stringifiedLinks = JSON.stringify([...urls]);
					stringifiedStyles = JSON.stringify(styles.map((s) => s.content));
					stringifiedScripts = JSON.stringify([...hoistedScripts]);
				} else {
					// Otherwise, use placeholders to inject styles and scripts
					// during the production bundle step.
					// @see the `astro:content-build-plugin` below.
					stringifiedLinks = JSON.stringify(LINKS_PLACEHOLDER);
					stringifiedStyles = JSON.stringify(STYLES_PLACEHOLDER);
					stringifiedScripts = JSON.stringify(SCRIPTS_PLACEHOLDER);
				}

				const code = `
					async function getMod() {
						return import(${JSON.stringify(basePath)});
					}
					const collectedLinks = ${stringifiedLinks};
					const collectedStyles = ${stringifiedStyles};
					const collectedScripts = ${stringifiedScripts};
					const defaultMod = { __astroPropagation: true, getMod, collectedLinks, collectedStyles, collectedScripts };
					export default defaultMod;
				`;
				// ^ Use a default export for tools like Markdoc
				// to catch the `__astroPropagation` identifier
				return { code, map: { mappings: '' } };
			}
		},
	};
}

export function astroConfigBuildPlugin(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	let ssrPluginContext: any = undefined;
	return {
		targets: ['server', 'content'],
		hooks: {
			'build:before': ({ target }) => {
				return {
					vitePlugin: {
						name: 'astro:content-build-plugin',
						generateBundle() {
							if (target === 'server') {
								ssrPluginContext = this;
							}
						},
					},
				};
			},
			'build:post': ({ ssrOutputs, clientOutputs, mutate }) => {
				const outputs = ssrOutputs.flatMap((o) => o.output);
				const prependBase = (src: string) => {
					if (options.settings.config.build.assetsPrefix) {
						return joinPaths(options.settings.config.build.assetsPrefix, src);
					} else {
						return prependForwardSlash(joinPaths(options.settings.config.base, src));
					}
				};
				for (const chunk of outputs) {
					if (
						chunk.type === 'chunk' &&
						(chunk.code.includes(LINKS_PLACEHOLDER) || chunk.code.includes(SCRIPTS_PLACEHOLDER))
					) {
						let entryStyles = new Set<string>();
						let entryLinks = new Set<string>();
						let entryScripts = new Set<string>();

						for (const id of Object.keys(chunk.modules)) {
							for (const [pageInfo] of walkParentInfos(id, ssrPluginContext)) {
								if (moduleIsTopLevelPage(pageInfo)) {
									const pageViteID = pageInfo.id;
									const pageData = getPageDataByViteID(internals, pageViteID);
									if (!pageData) continue;

									const _entryCss = pageData.propagatedStyles?.get(id);
									const _entryScripts = pageData.propagatedScripts?.get(id);
									if (_entryCss) {
										for (const value of _entryCss) {
											if (value.type === 'inline') entryStyles.add(value.content);
											if (value.type === 'external') entryLinks.add(value.src);
										}
									}
									if (_entryScripts) {
										for (const value of _entryScripts) {
											entryScripts.add(value);
										}
									}
								}
							}
						}

						let newCode = chunk.code;
						if (entryStyles.size) {
							newCode = newCode.replace(
								JSON.stringify(STYLES_PLACEHOLDER),
								JSON.stringify(Array.from(entryStyles))
							);
						}
						if (entryLinks.size) {
							newCode = newCode.replace(
								JSON.stringify(LINKS_PLACEHOLDER),
								JSON.stringify(Array.from(entryLinks).map(prependBase))
							);
						}
						if (entryScripts.size) {
							const entryFileNames = new Set<string>();
							for (const output of clientOutputs) {
								for (const clientChunk of output.output) {
									if (clientChunk.type !== 'chunk') continue;
									for (const [id] of Object.entries(clientChunk.modules)) {
										if (entryScripts.has(id)) {
											entryFileNames.add(clientChunk.fileName);
										}
									}
								}
							}
							newCode = newCode.replace(
								JSON.stringify(SCRIPTS_PLACEHOLDER),
								JSON.stringify(
									[...entryFileNames].map((src) => ({
										props: {
											src: prependBase(src),
											type: 'module',
										},
										children: '',
									}))
								)
							);
						}
						mutate(chunk, ['server'], newCode);
					}
				}
			},
		},
	};
}
