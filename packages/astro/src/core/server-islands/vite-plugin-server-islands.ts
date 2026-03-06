import MagicString from 'magic-string';
import type { ConfigEnv, DevEnvironment, Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';

export const SERVER_ISLAND_MANIFEST = 'virtual:astro:server-island-manifest';
const RESOLVED_SERVER_ISLAND_MANIFEST = '\0' + SERVER_ISLAND_MANIFEST;

export const serverIslandPlaceholderMap = "'$$server-islands-map$$'";
export const serverIslandPlaceholderNameMap = "'$$server-islands-name-map$$'";

/**
 * Resolved server island data captured during the prerender build.
 * When server islands are only used in prerendered pages, the SSR build
 * doesn't discover them and leaves placeholders in the output. This data
 * is populated during the prerender build's renderChunk so it can be used
 * in generateBundle to patch the SSR output in-memory, and in the
 * post-build phase to patch the on-disk SSR output.
 */
export interface ResolvedServerIslandData {
	/** Map of island name → chunk fileName (e.g. 'Island' → 'chunks/Island_abc123.mjs') */
	resolvedImports: Map<string, string>;
	/** Map of resolved component path → island display name */
	nameMap: Map<string, string>;
}

export function vitePluginServerIslands({ settings }: AstroPluginOptions): VitePlugin {
	let command: ConfigEnv['command'] = 'serve';
	let ssrEnvironment: DevEnvironment | null = null;
	const referenceIdMap = new Map<string, string>();
	const serverIslandMap = new Map();
	const serverIslandNameMap = new Map();

	// Resolved data captured during renderChunk for cross-environment patching.
	const resolvedServerIslandData: ResolvedServerIslandData = {
		resolvedImports: new Map(),
		nameMap: new Map(),
	};

	// Reference to the SSR manifest chunk, saved during SSR's generateBundle.
	// Patched in-memory during prerender's generateBundle so that any plugin
	// holding a reference to the chunk object (e.g. capture plugins) sees the
	// final code.
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

							// Append the name map, for prod
							serverIslandNameMap.set(comp.resolvedPath, name);
							serverIslandMap.set(name, comp.resolvedPath);

							// Build mode
							if (command === 'build') {
								let referenceId = this.emitFile({
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
						let mapSource = 'new Map([\n\t';
						for (let [name, path] of serverIslandMap) {
							mapSource += `\n\t['${name}', () => import('${path}')],`;
						}
						mapSource += ']);';

						return {
							code: `
					export const serverIslandMap = ${mapSource};
					\n\nexport const serverIslandNameMap = new Map(${JSON.stringify(Array.from(serverIslandNameMap.entries()), null, 2)});
					`,
						};
					}
				}
			},
		},

		renderChunk(code, chunk) {
			if (code.includes(serverIslandPlaceholderMap)) {
				if (referenceIdMap.size === 0) {
					if (command === 'build') {
						// During build, the SSR environment may not have discovered server islands
						// (they could be only in prerendered pages which build later). Leave
						// placeholders in place — they'll be replaced in generateBundle once
						// the prerender build resolves the island chunk filenames.
						return;
					}
					// Dev mode: fast-path to empty map replacement
					return {
						code: code
							.replace(serverIslandPlaceholderMap, 'new Map();')
							.replace(serverIslandPlaceholderNameMap, 'new Map()'),
						map: null,
					};
				}
				// The server island modules are in chunks/
				// This checks if this module is also in chunks/ and if so
				// make the import like import('../chunks/name.mjs')
				// TODO we could possibly refactor this to not need to emit separate chunks.
				const isRelativeChunk = !chunk.isEntry;
				const dots = isRelativeChunk ? '..' : '.';
				let mapSource = 'new Map([';
				let nameMapSource = 'new Map(';
				for (let [resolvedPath, referenceId] of referenceIdMap) {
					const fileName = this.getFileName(referenceId);
					const islandName = serverIslandNameMap.get(resolvedPath)!;
					mapSource += `\n\t['${islandName}', () => import('${dots}/${fileName}')],`;

					// Save resolved data for cross-environment patching
					resolvedServerIslandData.resolvedImports.set(islandName, fileName);
				}
				nameMapSource += `${JSON.stringify(Array.from(serverIslandNameMap.entries()), null, 2)}`;
				mapSource += '\n])';
				nameMapSource += '\n)';
				referenceIdMap.clear();

				// Save the name map for cross-environment patching
				for (const [resolvedPath, name] of serverIslandNameMap) {
					resolvedServerIslandData.nameMap.set(resolvedPath, name);
				}

				const ms = new MagicString(code);
				ms.replace(serverIslandPlaceholderMap, mapSource);
				ms.replace(serverIslandPlaceholderNameMap, nameMapSource);
				return {
					code: ms.toString(),
					map: ms.generateMap({ hires: 'boundary' }),
				};
			}
		},

		generateBundle(_options, bundle) {
			const envName = this.environment?.name;

			if (envName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr) {
				// Save a reference to the SSR manifest chunk that still has placeholders.
				for (const chunk of Object.values(bundle)) {
					if (chunk.type === 'chunk' && chunk.code.includes(serverIslandPlaceholderMap)) {
						ssrManifestChunk = chunk;
						break;
					}
				}
			}

			if (envName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender && ssrManifestChunk) {
				if (resolvedServerIslandData.resolvedImports.size > 0) {
					// Patch the SSR manifest chunk in-memory with the resolved island data.
					const isRelativeChunk = ssrManifestChunk.fileName.includes('/');
					const dots = isRelativeChunk ? '..' : '.';
					let mapSource = 'new Map([';
					for (const [islandName, fileName] of resolvedServerIslandData.resolvedImports) {
						mapSource += `\n\t['${islandName}', () => import('${dots}/${fileName}')],`;
					}
					mapSource += '\n])';

					let nameMapSource = 'new Map(';
					nameMapSource += `${JSON.stringify(Array.from(serverIslandNameMap.entries()), null, 2)}`;
					nameMapSource += '\n)';

					ssrManifestChunk.code = ssrManifestChunk.code
						.replace(serverIslandPlaceholderMap, mapSource)
						.replace(serverIslandPlaceholderNameMap, nameMapSource);
				} else {
					// No islands discovered — replace with empty maps
					ssrManifestChunk.code = ssrManifestChunk.code
						.replace(serverIslandPlaceholderMap, 'new Map()')
						.replace(serverIslandPlaceholderNameMap, 'new Map()');
				}
			}
		},

		// Expose resolved island data for the post-build phase via Vite's plugin API convention.
		api: {
			getResolvedServerIslandData(): ResolvedServerIslandData {
				return resolvedServerIslandData;
			},
		},
	};
}
