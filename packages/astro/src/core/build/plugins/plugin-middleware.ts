import type { Plugin as VitePlugin } from 'vite';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../../constants.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';
import { addRollupInput } from '../add-rollup-input.js';

export const MIDDLEWARE_MODULE_ID = '@astro-middleware';

const EMPTY_MIDDLEWARE = '\0empty-middleware';

export function vitePluginMiddleware(
	opts: StaticBuildOptions,
	_internals: BuildInternals
): VitePlugin {
	return {
		name: '@astro/plugin-middleware',

		options(options) {
			return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
		},

		async resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID || id.startsWith(EMPTY_MIDDLEWARE)) {
				const middlewareId = await this.resolve(
					`${opts.settings.config.srcDir.pathname}/${MIDDLEWARE_PATH_SEGMENT_NAME}`
				);
				if (middlewareId) {
					return `${middlewareId.id}?middleware`;
				} else {
					return `${EMPTY_MIDDLEWARE}?middleware`;
				}
			}
		},

		load(id) {
			if (id.endsWith('?middleware')) {
				const importee = id.slice(0, -'?middleware'.length);

				if (importee === EMPTY_MIDDLEWARE) {
					return 'export const onRequest = undefined';
				} else {
					return `import { onRequest } from "${importee}";
				export { onRequest }`;
				}
			}
			return null;
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
