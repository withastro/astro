import type { Plugin as VitePlugin } from 'vite';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../../constants.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';

export const MIDDLEWARE_MODULE_ID = '@astro-middleware';
export const RESOLVED_MIDDLEWARE_MODULE_ID = '\0@astro-middleware';

let inputs: Set<string> = new Set();
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

		resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID && opts.settings.config.experimental.middleware) {
				return RESOLVED_MIDDLEWARE_MODULE_ID;
			}
		},

		async load(id) {
			if (id === RESOLVED_MIDDLEWARE_MODULE_ID && opts.settings.config.experimental.middleware) {
				const imports: string[] = [];
				const exports: string[] = [];
				let middlewareId = await this.resolve(
					`${opts.settings.config.srcDir.pathname}/${MIDDLEWARE_PATH_SEGMENT_NAME}`
				);
				if (middlewareId) {
					imports.push(`import { onRequest } from "${middlewareId.id}"`);
					exports.push(`export { onRequest }`);
				}
				const result = [imports.join('\n'), exports.join('\n')];

				return result.join('\n');
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
