import type { ConfigEnv, DevEnvironment, Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { ServerIslandsState } from './shared-state.js';

export const SERVER_ISLAND_MANIFEST = 'virtual:astro:server-island-manifest';
const RESOLVED_SERVER_ISLAND_MANIFEST = '\0' + SERVER_ISLAND_MANIFEST;

const serverIslandPlaceholderMap = "'$$server-islands-map$$'";
const serverIslandPlaceholderNameMap = "'$$server-islands-name-map$$'";
export const SERVER_ISLAND_MAP_MARKER = '$$server-islands-map$$';
const serverIslandMapReplaceExp = /['"]\$\$server-islands-map\$\$['"]/g;
const serverIslandNameMapReplaceExp = /['"]\$\$server-islands-name-map\$\$['"]/g;

export function vitePluginServerIslands({
	settings,
	serverIslandsState,
}: AstroPluginOptions & { serverIslandsState: ServerIslandsState }): VitePlugin {
	let command: ConfigEnv['command'] = 'serve';
	let serverEnvironments: DevEnvironment[] = [];

	function ensureServerIslandReferenceIds(ctx: {
		emitFile: (file: { type: 'chunk'; id: string; importer?: string; name?: string }) => string;
	}) {
		for (const [resolvedPath, island] of serverIslandsState.getDiscoveredIslandEntries()) {
			if (serverIslandsState.hasReferenceId(resolvedPath)) continue;
			const referenceId = ctx.emitFile({
				type: 'chunk',
				id: island.specifier,
				importer: island.importer,
				name: island.islandName,
			});
			serverIslandsState.setReferenceId(resolvedPath, referenceId);
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
			// Collect all server-side environments that might cache the manifest module.
			// With adapters like Cloudflare that use a separate `prerender` environment,
			// we need to invalidate the manifest in all of them, not just `ssr`.
			serverEnvironments = [];
			for (const name of [
				ASTRO_VITE_ENVIRONMENT_NAMES.ssr,
				ASTRO_VITE_ENVIRONMENT_NAMES.prerender,
				ASTRO_VITE_ENVIRONMENT_NAMES.astro,
			]) {
				const env = server.environments[name];
				if (env) {
					serverEnvironments.push(env);
				}
			}
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
						if (!settings.adapter) {
							throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
						}

						const island = serverIslandsState.discover({
							resolvedPath: comp.resolvedPath,
							localName: comp.localName,
							specifier: comp.specifier ?? comp.resolvedPath,
							importer: id,
						});

						if (isBuildSsr && !serverIslandsState.hasReferenceId(comp.resolvedPath)) {
							const referenceId = this.emitFile({
								type: 'chunk',
								id: island.specifier,
								importer: island.importer,
								name: island.islandName,
							});
							serverIslandsState.setReferenceId(comp.resolvedPath, referenceId);
						}
					}
				}

				if (serverIslandsState.hasIslands()) {
					for (const env of serverEnvironments) {
						const mod = env.moduleGraph.getModuleById(RESOLVED_SERVER_ISLAND_MANIFEST);
						if (mod) {
							env.moduleGraph.invalidateModule(mod);
						}
					}
				}

				if (id === RESOLVED_SERVER_ISLAND_MANIFEST) {
					if (command === 'build' && settings.buildOutput) {
						const hasServerIslands = serverIslandsState.hasIslands();
						if (hasServerIslands && settings.buildOutput !== 'server') {
							throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
						}
					}

					if (command !== 'build' && serverIslandsState.hasIslands()) {
						const mapSource = serverIslandsState.createImportMapSourceFromDiscovered(
							(fileName) => fileName,
						);
						const nameMapSource = serverIslandsState.createNameMapSource();

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

					mapSource = serverIslandsState.createImportMapSourceFromReferences(
						(referenceId) => this.getFileName(referenceId),
						(fileName) => `${dots}/${fileName}`,
					);
				} else {
					mapSource = serverIslandsState.createImportMapSourceFromDiscovered(
						(fileName) => fileName,
					);
				}

				const nameMapSource = serverIslandsState.createNameMapSource();

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
