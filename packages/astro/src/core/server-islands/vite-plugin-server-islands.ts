import type { ConfigEnv, DevEnvironment, Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';

export const SERVER_ISLAND_MANIFEST = 'virtual:astro:server-island-manifest';
const RESOLVED_SERVER_ISLAND_MANIFEST = '\0' + SERVER_ISLAND_MANIFEST;

const serverIslandPlaceholderMap = '`$$server-islands-map$$`';
const serverIslandPlaceholderNameMap = '`$$server-islands-name-map$$`';
export const SERVER_ISLAND_MAP_MARKER = '$$server-islands-map$$';
const serverIslandMapReplaceExp = /['"]\$\$server-islands-map\$\$['"]/g;
const serverIslandNameMapReplaceExp = /['"]\$\$server-islands-name-map\$\$['"]/g;

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

	// serverIslandMap: displayName -> resolvedPath
	const serverIslandMap = new Map<string, string>();
	// serverIslandNameMap: resolvedPath -> displayName
	const serverIslandNameMap = new Map<string, string>();
	// resolvedPath -> source import details used for Rollup emission
	const serverIslandSourceMap = new Map<string, { id: string; importer: string }>();
	// resolvedPath -> rollup reference id
	const referenceIdMap = new Map<string, string>();

	function ensureServerIslandReferenceIds(ctx: {
		emitFile: (file: { type: 'chunk'; id: string; importer?: string; name?: string }) => string;
	}) {
		for (const [resolvedPath, islandName] of serverIslandNameMap) {
			if (referenceIdMap.has(resolvedPath)) continue;
			const source = serverIslandSourceMap.get(resolvedPath);
			const referenceId = ctx.emitFile({
				type: 'chunk',
				id: source?.id ?? resolvedPath,
				importer: source?.importer,
				name: islandName,
			});
			referenceIdMap.set(resolvedPath, referenceId);
		}
	}

	return {
		name: 'astro:server-islands',
		enforce: 'post',
		config(_config, { command: _command }) {
			command = _command;
		},
		buildStart() {
			if (command !== 'build' || this.environment?.name !== ASTRO_VITE_ENVIRONMENT_NAMES.ssr) {
				return;
			}

			ensureServerIslandReferenceIds(this);
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
					include: [/\.(astro|mdx)$/, new RegExp(`^${RESOLVED_SERVER_ISLAND_MANIFEST}$`)],
				},
			},
			async handler(_code, id) {
				const info = this.getModuleInfo(id);
				const astro = info ? (info.meta.astro as AstroPluginMetadata['astro']) : undefined;
				const isBuildSsr =
					command === 'build' && this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;

				if (astro) {
					for (const comp of astro.serverComponents) {
						if (!serverIslandNameMap.has(comp.resolvedPath)) {
							if (!settings.adapter) {
								throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
							}

							let name = comp.localName;
							let idx = 1;
							while (serverIslandMap.has(name)) {
								name += idx++;
							}

							serverIslandNameMap.set(comp.resolvedPath, name);
							serverIslandMap.set(name, comp.resolvedPath);
							serverIslandSourceMap.set(comp.resolvedPath, { id: comp.specifier, importer: id });
						}

						if (isBuildSsr && !referenceIdMap.has(comp.resolvedPath)) {
							const islandName = serverIslandNameMap.get(comp.resolvedPath);
							const source = serverIslandSourceMap.get(comp.resolvedPath);
							const referenceId = this.emitFile({
								type: 'chunk',
								id: source?.id ?? comp.resolvedPath,
								importer: source?.importer,
								name: islandName,
							});
							referenceIdMap.set(comp.resolvedPath, referenceId);
						}
					}
				}

				if (serverIslandNameMap.size > 0 && serverIslandMap.size > 0 && ssrEnvironment) {
					const mod = ssrEnvironment.moduleGraph.getModuleById(RESOLVED_SERVER_ISLAND_MANIFEST);
					if (mod) {
						ssrEnvironment.moduleGraph.invalidateModule(mod);
					}
				}

				if (id === RESOLVED_SERVER_ISLAND_MANIFEST) {
					if (command === 'build' && settings.buildOutput) {
						const hasServerIslands = serverIslandNameMap.size > 0;
						if (hasServerIslands && settings.buildOutput !== 'server') {
							throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
						}
					}

					if (command !== 'build' && serverIslandNameMap.size > 0 && serverIslandMap.size > 0) {
						const mapSource = createServerIslandImportMapSource(
							serverIslandMap,
							(fileName) => fileName,
						);
						const nameMapSource = createNameMapSource(serverIslandNameMap);

						return {
							code: `
						export const serverIslandMap = ${mapSource};

						export const serverIslandNameMap = ${nameMapSource};
						`,
						};
					}
				}
			},
		},

		renderChunk(code, chunk) {
			if (!code.includes(SERVER_ISLAND_MAP_MARKER)) return;

			if (command === 'build') {
				const envName = this.environment?.name;
				let mapSource: string;

				if (envName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr) {
					const isRelativeChunk = !chunk.isEntry;
					const dots = isRelativeChunk ? '..' : '.';
					const mapEntries: Array<[string, string]> = [];

					for (const [resolvedPath, referenceId] of referenceIdMap) {
						const fileName = this.getFileName(referenceId);
						const islandName = serverIslandNameMap.get(resolvedPath);
						if (!islandName) continue;
						mapEntries.push([islandName, fileName]);
					}

					mapSource = createServerIslandImportMapSource(
						mapEntries,
						(fileName) => `${dots}/${fileName}`,
					);
				} else {
					mapSource = createServerIslandImportMapSource(serverIslandMap, (fileName) => fileName);
				}

				const nameMapSource = createNameMapSource(serverIslandNameMap);

				return {
					code: code
						.replace(serverIslandMapReplaceExp, mapSource)
						.replace(serverIslandNameMapReplaceExp, nameMapSource),
					map: null,
				};
			}

			return {
				code: code
					.replace(serverIslandMapReplaceExp, 'new Map();')
					.replace(serverIslandNameMapReplaceExp, 'new Map()'),
				map: null,
			};
		},
	};
}
