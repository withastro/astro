import MagicString from 'magic-string';
import type { ConfigEnv, DevEnvironment, Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';

export const SERVER_ISLAND_MANIFEST = 'virtual:astro:server-island-manifest';
const RESOLVED_SERVER_ISLAND_MANIFEST = '\0' + SERVER_ISLAND_MANIFEST;

const serverIslandPlaceholderMap = "'$$server-islands-map$$'";
const serverIslandPlaceholderNameMap = "'$$server-islands-name-map$$'";

export function vitePluginServerIslands({ settings }: AstroPluginOptions): VitePlugin {
	let command: ConfigEnv['command'] = 'serve';
	let ssrEnvironment: DevEnvironment | null = null;
	const referenceIdMap = new Map<string, string>();
	const serverIslandMap = new Map();
	const serverIslandNameMap = new Map();
	return {
		name: 'astro:server-islands',
		enforce: 'post',
		config(_config, { command: _command }) {
			command = _command;
		},
		configureServer(server) {
			ssrEnvironment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.server];
		},
		resolveId(name) {
			if (name === SERVER_ISLAND_MANIFEST) {
				return RESOLVED_SERVER_ISLAND_MANIFEST;
			}
		},
		load(id) {
			if (id === RESOLVED_SERVER_ISLAND_MANIFEST) {
				return {
					code: `
					export const serverIslandMap = ${serverIslandPlaceholderMap};\n\nexport const serverIslandNameMap = ${serverIslandPlaceholderNameMap};
					`,
				};
			}
		},

		async transform(_code, id) {
			// We run the transform for all file extensions to support transformed files, eg. mdx
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

		renderChunk(code, chunk) {
			if (code.includes(serverIslandPlaceholderMap)) {
				if (referenceIdMap.size === 0) {
					// If there's no reference, we can fast-path to an empty map replacement
					// without sourcemaps as it doesn't shift rows
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
				}
				nameMapSource += `${JSON.stringify(Array.from(serverIslandNameMap.entries()), null, 2)}`;
				mapSource += '\n])';
				nameMapSource += '\n)';
				referenceIdMap.clear();

				const ms = new MagicString(code);
				ms.replace(serverIslandPlaceholderMap, mapSource);
				ms.replace(serverIslandPlaceholderNameMap, nameMapSource);
				return {
					code: ms.toString(),
					map: ms.generateMap({ hires: 'boundary' }),
				};
			}
		},
	};
}
