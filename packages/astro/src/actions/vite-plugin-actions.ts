import { fileURLToPath } from 'node:url';
import type fsMod from 'node:fs';
import {
	normalizePath as viteNormalizePath,
	type ViteDevServer,
	type Plugin as VitePlugin,
} from 'vite';
import type { BuildInternals } from '../core/build/internal.js';
import type { StaticBuildOptions } from '../core/build/types.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { getServerOutputDirectory } from '../prerender/utils.js';
import type { AstroSettings } from '../types/astro.js';
import {
	ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID,
	ACTIONS_RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID,
	OPTIONS_VIRTUAL_MODULE_ID,
	RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID,
	RESOLVED_OPTIONS_VIRTUAL_MODULE_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import { isActionsFilePresent } from './utils.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

/**
 * This plugin is used to retrieve the final entry point of the bundled actions.ts file
 * @param opts
 * @param internals
 */
export function vitePluginActionsBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	return {
		name: '@astro/plugin-actions-build',

		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro
			);
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (
					chunk.type !== 'asset' &&
					chunk.facadeModuleId === ACTIONS_RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID
				) {
					const outputDirectory = getServerOutputDirectory(opts.settings);
					internals.astroActionsEntryPoint = new URL(chunkName, outputDirectory);
				}
			}
		},
	};
}

const ACTIONS_DIR_NAME = 'actions';

export function vitePluginActions({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): VitePlugin {
	let resolvedActionsId: string;
	const normalizedSrcDir = viteNormalizePath(fileURLToPath(settings.config.srcDir));

	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(
					`^(${VIRTUAL_MODULE_ID}|${OPTIONS_VIRTUAL_MODULE_ID}|${ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID})$`,
				),
			},
			async handler(id) {
				if (id === VIRTUAL_MODULE_ID) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				if (id === OPTIONS_VIRTUAL_MODULE_ID) {
					return RESOLVED_OPTIONS_VIRTUAL_MODULE_ID;
				}
				if (id === ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID) {
					const resolvedModule = await this.resolve(
						`${decodeURI(new URL('actions', settings.config.srcDir).pathname)}`,
					);
					if (!resolvedModule) {
						return RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID;
					}
					resolvedActionsId = resolvedModule.id;
					return ACTIONS_RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID;
				}
			},
		},
		async configureServer(server: ViteDevServer) {
			const filePresentOnStartup = await isActionsFilePresent(fs, settings.config.srcDir);
			// Watch for the actions file to be created or deleted.
			async function watcherCallback() {
				const filePresent = await isActionsFilePresent(fs, settings.config.srcDir);
				if (filePresentOnStartup !== filePresent) {
					server.restart();
				}
			}
			server.watcher.on('add', watcherCallback);

			server.watcher.on('change', (path) => {
				watcherCallback();

				const normalizedPath = viteNormalizePath(path);
				// Check if the changed file is under the actions directory
				if (!normalizedPath.startsWith(normalizedSrcDir)) return;
				const relativePath = normalizedPath.slice(normalizedSrcDir.length);
				if (!relativePath.startsWith(`${ACTIONS_DIR_NAME}/`)) return;

				for (const name of [
					ASTRO_VITE_ENVIRONMENT_NAMES.ssr,
					ASTRO_VITE_ENVIRONMENT_NAMES.astro,
				] as const) {
					const environment = server.environments[name];
					if (!environment) continue;

					const virtualMod = environment.moduleGraph.getModuleById(
						ACTIONS_RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID,
					);
					if (virtualMod) {
						environment.moduleGraph.invalidateModule(virtualMod);
					}

					environment.hot.send('astro:actions-updated', {});
				}
			});
		},
		load: {
			filter: {
				id: new RegExp(
					`^(${RESOLVED_VIRTUAL_MODULE_ID}|${RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID}|${ACTIONS_RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID}|${RESOLVED_OPTIONS_VIRTUAL_MODULE_ID})$`,
				),
			},
			async handler(id) {
				if (id === RESOLVED_VIRTUAL_MODULE_ID) {
					if (this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
						return {
							code: `export * from 'astro/actions/runtime/entrypoints/client.js';`,
						};
					}
					return {
						code: `export * from 'astro/actions/runtime/entrypoints/server.js';`,
					};
				}

				if (id === RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID) {
					return { code: 'export const server = {}' };
				}

				if (id === ACTIONS_RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID) {
					return { code: `export { server } from ${JSON.stringify(resolvedActionsId)};` };
				}

				if (id === RESOLVED_OPTIONS_VIRTUAL_MODULE_ID) {
					return {
						code: `
						export const shouldAppendTrailingSlash = ${JSON.stringify(
							shouldAppendForwardSlash(settings.config.trailingSlash, settings.config.build.format),
						)};
					`,
					};
				}
			},
		},
	};
}
