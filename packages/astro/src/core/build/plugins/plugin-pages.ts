import type { Plugin as VitePlugin } from 'vite';
import { pagesVirtualModuleId, resolvedPagesVirtualModuleId } from '../../app/index.js';
import { addRollupInput } from '../add-rollup-input.js';
import { eachPageData, type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';
import { MIDDLEWARE_MODULE_ID } from './plugin-middleware.js';
import { RENDERERS_MODULE_ID } from './plugin-renderers.js';

function vitePluginPages(opts: StaticBuildOptions, internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/plugin-build-pages',

		options(options) {
			if (opts.settings.config.output === 'static') {
				return addRollupInput(options, [pagesVirtualModuleId]);
			}
		},

		resolveId(id) {
			if (id === pagesVirtualModuleId) {
				return resolvedPagesVirtualModuleId;
			}
		},

		async load(id) {
			if (id === resolvedPagesVirtualModuleId) {
				let importMap = '';
				const imports: string[] = [];
				const exports: string[] = [];
				const content: string[] = [];
				let i = 0;
				imports.push(`import { renderers } from "${RENDERERS_MODULE_ID}";`);
				exports.push(`export { renderers };`);
				for (const pageData of eachPageData(internals)) {
					const variable = `_page${i}`;
					imports.push(
						`const ${variable} = () => import(${JSON.stringify(pageData.moduleSpecifier)});`
					);
					importMap += `[${JSON.stringify(pageData.component)}, ${variable}],`;
					i++;
				}

				if (opts.settings.config.experimental.middleware) {
					imports.push(`import * as _middleware from "${MIDDLEWARE_MODULE_ID}";`);
					exports.push(`export const middleware = _middleware;`);
				}

				content.push(`export const pageMap = new Map([${importMap}]);`);

				return `${imports.join('\n')}${content.join('\n')}${exports.join('\n')}`;
			}
		},
	};
}

export function pluginPages(opts: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin {
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginPages(opts, internals),
				};
			},
		},
	};
}
