import type { Plugin as VitePlugin } from 'vite';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../../constants.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';

export const MIDDLEWARE_MODULE_ID = '@astro-middleware';

export function vitePluginMiddleware(
	opts: StaticBuildOptions,
	_internals: BuildInternals
): VitePlugin {
	return {
		name: '@astro/plugin-middleware',
		options(options) {
			if (opts.settings.config.experimental.middleware) {
				return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
			}
		},

		async resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID && opts.settings.config.experimental.middleware) {
				const middlewareId = await this.resolve(
					`${opts.settings.config.srcDir.pathname}/${MIDDLEWARE_PATH_SEGMENT_NAME}`
				);
				if (middlewareId) {
					return middlewareId.id;
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
