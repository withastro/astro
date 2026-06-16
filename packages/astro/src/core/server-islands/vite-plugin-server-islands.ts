import type { BuildEnvironment, ConfigEnv, Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
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
		api: {
			hasServerIslands(): boolean {
				return serverIslandsState.hasIslands();
			},
		},
		config(_config, { command: _command }) {
			command = _command;
			serverIslandsState.setCommand(_command);
		},
		buildStart() {
			if (command !== 'build' || this.environment?.name !== ASTRO_VITE_ENVIRONMENT_NAMES.ssr) {
				return;
			}

			ensureServerIslandReferenceIds(this);
		},
		configureServer(server) {
			// Track all server-side environments that might cache the manifest module.
			// The shared server islands state invalidates these when new islands are discovered.
			const serverEnvironments = [];
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
			serverIslandsState.setServerEnvironments(serverEnvironments);
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
				// In dev, return the actual island map directly. The module is invalidated
				// whenever new islands are discovered, so this always reflects current state.
				if (command !== 'build' && serverIslandsState.hasIslands()) {
					const mapSource = serverIslandsState.createImportMapSourceFromDiscovered(
						(fileName) => fileName,
					);
					const nameMapSource = serverIslandsState.createNameMapSource();
					return {
						code: `export const serverIslandMap = ${mapSource};\n\nexport const serverIslandNameMap = ${nameMapSource};`,
					};
				}

				// In build, return placeholders that renderChunk will replace with final paths.
				if (command === 'build' && serverIslandsState.hasIslands() && !settings.adapter) {
					throw new AstroError(AstroErrorData.NoAdapterInstalledServerIslands);
				}
				return {
					code: `export const serverIslandMap = ${serverIslandPlaceholderMap};\n\nexport const serverIslandNameMap = ${serverIslandPlaceholderNameMap};`,
				};
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

/**
 * Checks if the prerender environment discovered any server islands during the build.
 * This encapsulates the logic of finding the server islands plugin and querying its state.
 */
export function hasServerIslands(environment: BuildEnvironment): boolean {
	const plugins = environment.config.plugins ?? [];
	const serverIslandsPlugin = plugins.find((p) => p.name === 'astro:server-islands');
	return (
		typeof serverIslandsPlugin?.api?.hasServerIslands === 'function' &&
		serverIslandsPlugin.api.hasServerIslands()
	);
}
