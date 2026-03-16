import fs from 'node:fs';
import type { ConfigEnv, DevEnvironment, Plugin as VitePlugin } from 'vite';
import { getPrerenderOutputDirectory, getServerOutputDirectory } from '../../prerender/utils.js';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { appendForwardSlash } from '../path.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';

export const SERVER_ISLAND_MANIFEST = 'virtual:astro:server-island-manifest';
const RESOLVED_SERVER_ISLAND_MANIFEST = '\0' + SERVER_ISLAND_MANIFEST;

export const serverIslandPlaceholderMap = "'$$server-islands-map$$'";
const serverIslandPlaceholderNameMap = "'$$server-islands-name-map$$'";

function createServerIslandImportMapSource(
	entries: Iterable<[string, string]>,
	toImportPath: (fileName: string) => string,
) {
	const mappings = Array.from(entries, ([islandName, fileName]) => {
		const importPath = toImportPath(fileName);
		return `\t[${JSON.stringify(islandName)}, () => import(${JSON.stringify(importPath)})],`;
	});

	return `new Map([\n${mappings.join('\n')}\n])`;
}

function createNameMapSource(entries: Iterable<[string, string]>) {
	return `new Map(${JSON.stringify(Array.from(entries), null, 2)})`;
}

export function vitePluginServerIslands({ settings }: AstroPluginOptions): VitePlugin {
	let command: ConfigEnv['command'] = 'serve';
	let ssrEnvironment: DevEnvironment | null = null;
	const referenceIdMap = new Map<string, string>();

	// Maps populated during transform to discover server island components.
	// serverIslandMap: displayName → resolvedPath (e.g. 'Island' → '/abs/path/Island.astro')
	// serverIslandNameMap: resolvedPath → displayName (reverse of above)
	const serverIslandMap = new Map<string, string>();
	const serverIslandNameMap = new Map<string, string>();

	// Resolved island chunk filenames discovered across SSR + prerender builds.
	// Map of displayName → chunk fileName (e.g. 'Island' → 'chunks/Island_abc123.mjs')
	const resolvedIslandImports = new Map<string, string>();

	// Reference to the SSR manifest chunk, saved during SSR's generateBundle.
	// Patched in-memory during prerender's generateBundle so test capture plugins
	// and other post plugins observe final code without placeholders.
	let ssrManifestChunk: { code: string; fileName: string } | null = null;

	return {
		name: 'astro:server-islands',
		enforce: 'post',
		config(_config, { command: _command }) {
			command = _command;
		},
		configureServer(server) {
			ssrEnvironment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${SERVER_ISLAND_MANIFEST}$`),
			},
			handler() {
				return RESOLVED_SERVER_ISLAND_MANIFEST;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_SERVER_ISLAND_MANIFEST}$`),
			},
			handler() {
				return {
					code: `export const serverIslandMap = ${serverIslandPlaceholderMap};\n\nexport const serverIslandNameMap = ${serverIslandPlaceholderNameMap};`,
				};
			},
		},

		transform: {
			filter: {
				id: {
					include: [
						// Allows server islands in astro and mdx files
						/\.(astro|mdx)$/,
						new RegExp(`^${RESOLVED_SERVER_ISLAND_MANIFEST}$`),
					],
				},
			},
			async handler(_code, id) {
				const info = this.getModuleInfo(id);

				const astro = info ? (info.meta.astro as AstroPluginMetadata['astro']) : undefined;

				if (astro) {
					for (const comp of astro.serverComponents) {
						if (!serverIslandNameMap.has(comp.resolvedPath)) {
							if (!settings.adapter) {
								throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
							}
							let name = comp.localName;
							let idx = 1;

							while (true) {
								// Name not taken, let's use it.
								if (!serverIslandMap.has(name)) {
									break;
								}
								// Increment a number onto the name: Avatar -> Avatar1
								name += idx++;
							}

							// Track the island component for later build/dev use
							serverIslandNameMap.set(comp.resolvedPath, name);
							serverIslandMap.set(name, comp.resolvedPath);

							if (command === 'build') {
								const referenceId = this.emitFile({
									type: 'chunk',
									id: comp.specifier,
									importer: id,
									name: comp.localName,
								});
								referenceIdMap.set(comp.resolvedPath, referenceId);
							}
						}
					}
				}

				if (serverIslandNameMap.size > 0 && serverIslandMap.size > 0 && ssrEnvironment) {
					// In dev, we need to clear the module graph so that Vite knows to re-transform
					// the module with the new island information.
					const mod = ssrEnvironment.moduleGraph.getModuleById(RESOLVED_SERVER_ISLAND_MANIFEST);
					if (mod) {
						ssrEnvironment.moduleGraph.invalidateModule(mod);
					}
				}

				if (id === RESOLVED_SERVER_ISLAND_MANIFEST) {
					if (command === 'build' && settings.buildOutput) {
						const hasServerIslands = serverIslandNameMap.size > 0;
						// Error if there are server islands but no adapter provided.
						if (hasServerIslands && settings.buildOutput !== 'server') {
							throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
						}
					}

					if (serverIslandNameMap.size > 0 && serverIslandMap.size > 0) {
						const mapSource = createServerIslandImportMapSource(
							serverIslandMap,
							(fileName) => fileName,
						);
						const nameMapSource = createNameMapSource(serverIslandNameMap);

						return {
							code: `
					export const serverIslandMap = ${mapSource};
					\n\nexport const serverIslandNameMap = ${nameMapSource};
					`,
						};
					}
				}
			},
		},

		renderChunk(code, chunk) {
			if (code.includes(serverIslandPlaceholderMap)) {
				if (command === 'build') {
					if (referenceIdMap.size === 0) {
						// SSR may not discover islands if they only appear in prerendered pages.
						// Leave placeholders for post-build patching in that case.
						return;
					}

					const isRelativeChunk = !chunk.isEntry;
					const dots = isRelativeChunk ? '..' : '.';
					const mapEntries: Array<[string, string]> = [];
					for (const [resolvedPath, referenceId] of referenceIdMap) {
						const fileName = this.getFileName(referenceId);
						const islandName = serverIslandNameMap.get(resolvedPath);
						if (!islandName) continue;
						if (!resolvedIslandImports.has(islandName)) {
							resolvedIslandImports.set(islandName, fileName);
						}
						mapEntries.push([islandName, fileName]);
					}
					const mapSource = createServerIslandImportMapSource(
						mapEntries,
						(fileName) => `${dots}/${fileName}`,
					);
					const nameMapSource = createNameMapSource(serverIslandNameMap);

					return {
						code: code
							.replace(serverIslandPlaceholderMap, mapSource)
							.replace(serverIslandPlaceholderNameMap, nameMapSource),
						map: null,
					};
				}
				// Dev mode: fast-path to empty map replacement
				return {
					code: code
						.replace(serverIslandPlaceholderMap, 'new Map();')
						.replace(serverIslandPlaceholderNameMap, 'new Map()'),
					map: null,
				};
			}
		},

		generateBundle(_options, bundle) {
			const envName = this.environment?.name;

			if (envName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr) {
				for (const chunk of Object.values(bundle)) {
					if (chunk.type === 'chunk' && chunk.code.includes(serverIslandPlaceholderMap)) {
						ssrManifestChunk = chunk;
						break;
					}
				}
			}

			if (envName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender && ssrManifestChunk) {
				if (resolvedIslandImports.size > 0) {
					const isRelativeChunk = ssrManifestChunk.fileName.includes('/');
					const dots = isRelativeChunk ? '..' : '.';
					const mapSource = createServerIslandImportMapSource(
						resolvedIslandImports,
						(fileName) => `${dots}/${fileName}`,
					);
					const nameMapSource = createNameMapSource(serverIslandNameMap);

					ssrManifestChunk.code = ssrManifestChunk.code
						.replace(serverIslandPlaceholderMap, mapSource)
						.replace(serverIslandPlaceholderNameMap, nameMapSource);
				} else {
					ssrManifestChunk.code = ssrManifestChunk.code
						.replace(serverIslandPlaceholderMap, 'new Map()')
						.replace(serverIslandPlaceholderNameMap, 'new Map()');
				}
			}
		},

		api: {
			/**
			 * Post-build hook that patches SSR chunks containing server island placeholders.
			 *
			 * During build, SSR can run before all server islands are discovered (e.g. islands
			 * only used in prerendered pages). This hook runs after SSR + prerender builds and:
			 * 1) replaces placeholders with the complete map of discovered islands
			 * 2) copies island chunks emitted in prerender into the SSR output directory
			 *
			 * Two cases:
			 * 1. Islands were discovered: Replace placeholders with real import maps.
			 * 2. No islands found: Replace placeholders with empty maps.
			 */
			async buildPostHook({
				chunks,
				mutate,
			}: {
				chunks: Array<{ fileName: string; code: string; prerender: boolean }>;
				mutate: (fileName: string, code: string, prerender: boolean) => void;
			}) {
				// Find SSR chunks that still have the placeholder (not prerender chunks)
				const ssrChunkWithPlaceholder = chunks.find(
					(c) => !c.prerender && c.code.includes(serverIslandPlaceholderMap),
				);

				if (!ssrChunkWithPlaceholder) {
					return;
				}

				if (resolvedIslandImports.size > 0) {
					// Server islands were discovered across SSR/prerender builds.
					// Construct import paths relative to the SSR chunk's location.
					const isRelativeChunk = ssrChunkWithPlaceholder.fileName.includes('/');
					const dots = isRelativeChunk ? '..' : '.';

					const mapSource = createServerIslandImportMapSource(
						resolvedIslandImports,
						(fileName) => `${dots}/${fileName}`,
					);
					const nameMapSource = createNameMapSource(serverIslandNameMap);

					const newCode = ssrChunkWithPlaceholder.code
						.replace(serverIslandPlaceholderMap, mapSource)
						.replace(serverIslandPlaceholderNameMap, nameMapSource);

					mutate(ssrChunkWithPlaceholder.fileName, newCode, false);

					const serverOutputDir = getServerOutputDirectory(settings);
					const prerenderOutputDir = getPrerenderOutputDirectory(settings);
					for (const [, fileName] of resolvedIslandImports) {
						const srcPath = new URL(fileName, appendForwardSlash(prerenderOutputDir.toString()));
						const destPath = new URL(fileName, appendForwardSlash(serverOutputDir.toString()));

						if (!fs.existsSync(srcPath)) continue;
						const destDir = new URL('./', destPath);
						await fs.promises.mkdir(destDir, { recursive: true });
						await fs.promises.copyFile(srcPath, destPath);
					}
				} else {
					// No server islands found — replace placeholders with empty maps
					const newCode = ssrChunkWithPlaceholder.code
						.replace(serverIslandPlaceholderMap, 'new Map()')
						.replace(serverIslandPlaceholderNameMap, 'new Map()');

					mutate(ssrChunkWithPlaceholder.fileName, newCode, false);
				}
			},
		},
	};
}
