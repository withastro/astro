import { extname } from 'node:path';
import type { Plugin as VitePlugin } from 'vite';
import { routeIsRedirect } from '../../redirects/index.js';
import { addRollupInput } from '../add-rollup-input.js';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import type { StaticBuildOptions } from '../types';
import { MIDDLEWARE_MODULE_ID } from './plugin-middleware.js';
import { RENDERERS_MODULE_ID } from './plugin-renderers.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN, getPathFromVirtualModulePageName } from './util.js';

export const ASTRO_PAGE_MODULE_ID = '@astro-page:';
export const ASTRO_PAGE_RESOLVED_MODULE_ID = '\0' + ASTRO_PAGE_MODULE_ID;

/**
 * 1. We add a fixed prefix, which is used as virtual module naming convention;
 * 2. We replace the dot that belongs extension with an arbitrary string.
 *
 * @param path
 */
export function getVirtualModulePageNameFromPath(path: string) {
	// we mask the extension, so this virtual file
	// so rollup won't trigger other plugins in the process
	const extension = extname(path);
	return `${ASTRO_PAGE_MODULE_ID}${path.replace(
		extension,
		extension.replace('.', ASTRO_PAGE_EXTENSION_POST_PATTERN)
	)}`;
}

export function getVirtualModulePageIdFromPath(path: string) {
	const name = getVirtualModulePageNameFromPath(path);
	return '\x00' + name;
}

function vitePluginPages(opts: StaticBuildOptions, internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/plugin-build-pages',

		options(options) {
			if (opts.settings.config.output === 'static') {
				const inputs = new Set<string>();

				for (const [path, pageData] of Object.entries(opts.allPages)) {
					if (routeIsRedirect(pageData.route)) {
						continue;
					}
					inputs.add(getVirtualModulePageNameFromPath(path));
				}

				return addRollupInput(options, Array.from(inputs));
			}
		},

		resolveId(id) {
			if (id.startsWith(ASTRO_PAGE_MODULE_ID)) {
				return '\0' + id;
			}
		},

		async load(id) {
			if (id.startsWith(ASTRO_PAGE_RESOLVED_MODULE_ID)) {
				const imports: string[] = [];
				const exports: string[] = [];
				const pageName = getPathFromVirtualModulePageName(ASTRO_PAGE_RESOLVED_MODULE_ID, id);
				const pageData = internals.pagesByComponent.get(pageName);
				if (pageData) {
					const resolvedPage = await this.resolve(pageData.moduleSpecifier);
					if (resolvedPage) {
						imports.push(`const page = () => import(${JSON.stringify(pageData.moduleSpecifier)});`);
						exports.push(`export { page }`);

						imports.push(`import { renderers } from "${RENDERERS_MODULE_ID}";`);
						exports.push(`export { renderers };`);

						// The middleware should not be imported by the pages
						if (!opts.settings.config.build.excludeMiddleware) {
							const middlewareModule = await this.resolve(MIDDLEWARE_MODULE_ID);
							if (middlewareModule) {
								imports.push(`import { onRequest } from "${middlewareModule.id}";`);
								exports.push(`export { onRequest };`);
							}
						}

						return `${imports.join('\n')}${exports.join('\n')}`;
					}
				}
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
