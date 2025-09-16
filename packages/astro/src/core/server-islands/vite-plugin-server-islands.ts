import MagicString from 'magic-string';
import type { ConfigEnv, DevEnvironment, Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';

export const VIRTUAL_ISLAND_MAP_ID = '@astro-server-islands';
const RESOLVED_VIRTUAL_ISLAND_MAP_ID = '\0' + VIRTUAL_ISLAND_MAP_ID;

export const SERVER_ISLAND_MANIFEST = 'virtual:astro-server-island-manifest';
const RESOLVED_SERVER_ISLAND_MANIFEST = '\0' + SERVER_ISLAND_MANIFEST;

const serverIslandPlaceholder = "'$$server-islands$$'";

export function vitePluginServerIslands({ settings }: AstroPluginOptions): VitePlugin {
	let command: ConfigEnv['command'] = 'serve';
	let ssrEnvironment: DevEnvironment | null = null;
	const referenceIdMap = new Map<string, string>();
	return {
		name: 'astro:server-islands',
		enforce: 'post',
		config(_config, { command: _command }) {
			command = _command;
		},
		configureServer(server) {
			ssrEnvironment = server.environments.ssr;
		},
		resolveId(name) {
			if (name === VIRTUAL_ISLAND_MAP_ID) {
				return RESOLVED_VIRTUAL_ISLAND_MAP_ID;
			}
			if (name === SERVER_ISLAND_MANIFEST) {
				return RESOLVED_SERVER_ISLAND_MANIFEST;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_ISLAND_MAP_ID) {
				return { code: `export const serverIslandMap = ${serverIslandPlaceholder};` };
			}
			if (id === RESOLVED_SERVER_ISLAND_MANIFEST) {
				let mapSource = 'new Map([';
				for (let [resolvedPath, name] of settings.serverIslandNameMap) {
					mapSource += `\n\t['${name}', () => import(/* @vite-ignore */'${resolvedPath}')],`;
				}
				mapSource += '\n]);';

				return {
					code: `export const serverIslandNameMap = new Map(${JSON.stringify(
						Array.from(settings.serverIslandNameMap.entries()),
					)});\nexport const serverIslandMap = ${mapSource}
					;`,
				};
			}
		},
		transform(_code, id) {
			// We run the transform for all file extensions to support transformed files, eg. mdx
			const info = this.getModuleInfo(id);
			if (!info?.meta?.astro) return;

			const astro = info.meta.astro as AstroPluginMetadata['astro'];

			let hasAddedIsland = false;

			for (const comp of astro.serverComponents) {
				if (!settings.serverIslandNameMap.has(comp.resolvedPath)) {
					if (!settings.adapter) {
						throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
					}
					let name = comp.localName;
					let idx = 1;

					while (true) {
						// Name not taken, let's use it.
						if (!settings.serverIslandMap.has(name)) {
							break;
						}
						// Increment a number onto the name: Avatar -> Avatar1
						name += idx++;
					}

					// Append the name map, for prod
					settings.serverIslandNameMap.set(comp.resolvedPath, name);
					settings.serverIslandMap.set(name, () => {
						return import(/* @vite-ignore */ comp.resolvedPath);
					});

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
					hasAddedIsland = true;
				}
			}
			if (hasAddedIsland && ssrEnvironment) {
				// In dev, we need to clear the module graph so that Vite knows to re-transform
				// the module with the new island information.
				for (const modId of [VIRTUAL_ISLAND_MAP_ID, SERVER_ISLAND_MANIFEST]) {
					const mod = ssrEnvironment.moduleGraph.getModuleById(modId);
					if (mod) {
						ssrEnvironment.moduleGraph.invalidateModule(mod);
					}
				}
			}
		},
		renderChunk(code) {
			if (code.includes(serverIslandPlaceholder)) {
				// If there's no reference, we can fast-path to an empty map replacement
				// without sourcemaps as it doesn't shift rows
				if (referenceIdMap.size === 0) {
					return {
						code: code.replace(serverIslandPlaceholder, 'new Map();'),
						map: null,
					};
				}

				let mapSource = 'new Map([';
				for (let [resolvedPath, referenceId] of referenceIdMap) {
					const fileName = this.getFileName(referenceId);
					const islandName = settings.serverIslandNameMap.get(resolvedPath)!;
					mapSource += `\n\t['${islandName}', () => import('./${fileName}')],`;
				}
				mapSource += '\n]);';
				referenceIdMap.clear();

				const ms = new MagicString(code);
				ms.replace(serverIslandPlaceholder, mapSource);
				return {
					code: ms.toString(),
					map: ms.generateMap({ hires: 'boundary' }),
				};
			}
		},
	};
}
