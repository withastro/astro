import type fsMod from 'node:fs';
import type { Plugin as VitePlugin } from 'vite';
import { addRollupInput } from '../core/build/add-rollup-input.js';
import type { BuildInternals } from '../core/build/internal.js';
import type { StaticBuildOptions } from '../core/build/types.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { getServerOutputDirectory } from '../prerender/utils.js';
import type { AstroSettings } from '../types/astro.js';
import {
	CODEGEN_VIRTUAL_MODULE_ID,
	ENTRYPOINT_VIRTUAL_MODULE_ID,
	RESOLVED_CODEGEN_VIRTUAL_MODULE_ID,
	RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID,
	RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID,
	RESOLVED_NOOP_VIRTUAL_MODULE_ID,
	RESOLVED_RUNTIME_VIRTUAL_MODULE_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	RUNTIME_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import { isActionsFilePresent } from './utils.js';

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

		options(options) {
			return addRollupInput(options, [ENTRYPOINT_VIRTUAL_MODULE_ID]);
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (
					chunk.type !== 'asset' &&
					chunk.facadeModuleId === RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID
				) {
					const outputDirectory = getServerOutputDirectory(opts.settings);
					internals.astroActionsEntryPoint = new URL(chunkName, outputDirectory);
				}
			}
		},
	};
}

export function vitePluginActions({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): VitePlugin {
	let resolvedActionsId: string;

	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		async resolveId(id, importer) {
			if (id === VIRTUAL_MODULE_ID) {
				// When astro:actions is imported in the actions entrypoint, we return
				// a noop for the exported actions object
				if (importer === resolvedActionsId) {
					return RESOLVED_NOOP_VIRTUAL_MODULE_ID;
				}
				return RESOLVED_VIRTUAL_MODULE_ID;
			}

			if (id === RUNTIME_VIRTUAL_MODULE_ID) {
				return RESOLVED_RUNTIME_VIRTUAL_MODULE_ID;
			}

			if (id === ENTRYPOINT_VIRTUAL_MODULE_ID) {
				const resolvedModule = await this.resolve(
					`${decodeURI(new URL('actions', settings.config.srcDir).pathname)}`,
				);

				// If there's no action entrypoint, we return a noop server object
				if (!resolvedModule) {
					return RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID;
				}
				resolvedActionsId = resolvedModule.id;
				return RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID;
			}

			if (id === RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID) {
				return RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID;
			}

			if (id === CODEGEN_VIRTUAL_MODULE_ID) {
				return RESOLVED_CODEGEN_VIRTUAL_MODULE_ID;
			}
		},
		async configureServer(server) {
			const filePresentOnStartup = await isActionsFilePresent(fs, settings.config.srcDir);
			// Watch for the actions file to be created.
			async function watcherCallback() {
				const filePresent = await isActionsFilePresent(fs, settings.config.srcDir);
				if (filePresentOnStartup !== filePresent) {
					server.restart();
				}
			}
			server.watcher.on('add', watcherCallback);
			server.watcher.on('change', watcherCallback);
		},
		async load(id, opts) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return {
					code: `export { actions, getActionPath } from ${JSON.stringify(CODEGEN_VIRTUAL_MODULE_ID)}; export * from ${JSON.stringify(RUNTIME_VIRTUAL_MODULE_ID)};`,
				};
			}

			if (id === RESOLVED_NOOP_VIRTUAL_MODULE_ID) {
				return {
					code: `
						export const actions = {};
						${getActionPathContents(
							shouldAppendForwardSlash(settings.config.trailingSlash, settings.config.build.format),
						)}
						export * from ${JSON.stringify(RUNTIME_VIRTUAL_MODULE_ID)};`,
				};
			}

			if (id === RESOLVED_RUNTIME_VIRTUAL_MODULE_ID) {
				return {
					code: opts?.ssr
						? `export * from 'astro/actions/runtime/virtual/server.js';`
						: `export * from 'astro/actions/runtime/virtual/client.js';`,
				};
			}

			if (id === RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID) {
				return `export { server } from ${JSON.stringify(resolvedActionsId)};`;
			}

			if (id === RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID) {
				return {
					code: 'export const server = {};',
				};
			}
			if (id === RESOLVED_CODEGEN_VIRTUAL_MODULE_ID) {
				let code = await fs.promises.readFile(
					new URL('../../templates/actions.mjs', import.meta.url),
					'utf-8',
				);
				code += getActionPathContents(
					shouldAppendForwardSlash(settings.config.trailingSlash, settings.config.build.format),
				);
				return { code };
			}
		},
	};
}

function getActionPathContents(appendForwardSlash: boolean) {
	return `
import {
	ACTION_QUERY_PARAMS,
	appendForwardSlash,
} from ${JSON.stringify(RUNTIME_VIRTUAL_MODULE_ID)};

export function getActionPath(action) {
	let path = \`\${import.meta.env.BASE_URL.replace(/\\/$/, '')}/_actions/\${new URLSearchParams(action.toString()).get(ACTION_QUERY_PARAMS.actionName)}\`;
	${appendForwardSlash && 'path = appendForwardSlash(path);'}
	return path;
}`;
}
