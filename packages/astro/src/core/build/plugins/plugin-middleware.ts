import type { Plugin as VitePlugin } from 'vite';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../../constants.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { BuildInternals } from '../internal';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';

export const MIDDLEWARE_MODULE_ID = '@astro-middleware';

const EMPTY_MIDDLEWARE = '\0empty-middleware';

export function vitePluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals
): VitePlugin {
	let resolvedMiddlewareId: string;
	return {
		name: '@astro/plugin-middleware',

		options(options) {
			return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
		},

		async resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID) {
				const middlewareId = await this.resolve(
					`${opts.settings.config.srcDir.pathname}/${MIDDLEWARE_PATH_SEGMENT_NAME}`
				);
				if (middlewareId) {
					resolvedMiddlewareId = middlewareId.id;
					return middlewareId.id;
				} else {
					return EMPTY_MIDDLEWARE;
				}
			}
			if (id === EMPTY_MIDDLEWARE) {
				return EMPTY_MIDDLEWARE;
			}
		},

		load(id) {
			if (id === EMPTY_MIDDLEWARE) {
				return 'export const onRequest = undefined';
			} else if (id === resolvedMiddlewareId) {
				this.emitFile({
					type: 'chunk',
					preserveSignature: 'strict',
					fileName: 'middleware.mjs',
					id,
				});
			}
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.fileName === 'middleware.mjs') {
					internals.middlewareEntryPoint = new URL(chunkName, opts.settings.config.build.server);
				}
			}
		},
	};
}

export function pluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginMiddleware(opts, internals),
				};
			},
		},
	};
}
