import type { Plugin as VitePlugin } from 'vite';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../../constants.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';
import { existsSync } from 'node:fs';

export const MIDDLEWARE_MODULE_ID = '@astro-middleware';
export const RESOLVED_MIDDLEWARE_MODULE_ID = '\0@astro-middleware';

let inputs: Set<string> = new Set();

function middlewareFileExists(opts: StaticBuildOptions): boolean {
	const middlewareFile = `${opts.settings.config.srcDir.pathname}/${MIDDLEWARE_PATH_SEGMENT_NAME}`;
	return existsSync(middlewareFile);
}

export function vitePluginMiddleware(
	opts: StaticBuildOptions,
	_internals: BuildInternals
): VitePlugin {
	return {
		name: '@astro/plugin-middleware',
		options(options) {
			if (middlewareFileExists(opts)) {
				return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
			}
		},

		resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID && middlewareFileExists(opts)) {
				return RESOLVED_MIDDLEWARE_MODULE_ID;
			}
		},

		async load(id) {
			if (id === RESOLVED_MIDDLEWARE_MODULE_ID) {
				const imports: string[] = [];
				const exports: string[] = [];
				let middlewareId = await this.resolve(
					`${opts.settings.config.srcDir.pathname}/${MIDDLEWARE_PATH_SEGMENT_NAME}`
				);
				if (middlewareId) {
					imports.push(`import { onRequest } from "${middlewareId.id}";`);
					exports.push(`export { onRequest }`);

					return `${imports.join('\n')}\n${exports.join('\n')}`;
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
