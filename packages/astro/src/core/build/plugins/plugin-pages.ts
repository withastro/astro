import type { Plugin as VitePlugin } from 'vite';
import { routeIsRedirect } from '../../redirects/index.js';
import { addRollupInput } from '../add-rollup-input.js';
import { type BuildInternals, eachPageFromAllPages } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
import { RENDERERS_MODULE_ID } from './plugin-renderers.js';
import { getPathFromVirtualModulePageName, getVirtualModulePageNameFromPath } from './util.js';

export const ASTRO_PAGE_MODULE_ID = '@astro-page:';
export const ASTRO_PAGE_RESOLVED_MODULE_ID = '\0' + ASTRO_PAGE_MODULE_ID;

export function getVirtualModulePageIdFromPath(path: string) {
	const name = getVirtualModulePageNameFromPath(ASTRO_PAGE_MODULE_ID, path);
	return '\x00' + name;
}

function vitePluginPages(opts: StaticBuildOptions, internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/plugin-build-pages',
		options(options) {
			if (opts.settings.config.output === 'static') {
				const inputs = new Set<string>();

				for (const [path, pageData] of eachPageFromAllPages(opts.allPages)) {
					if (routeIsRedirect(pageData.route)) {
						continue;
					}
					inputs.add(getVirtualModulePageNameFromPath(ASTRO_PAGE_MODULE_ID, path));
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

						return `${imports.join('\n')}${exports.join('\n')}`;
					}
				}
			}
		},
	};
}

export function pluginPages(opts: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginPages(opts, internals),
				};
			},
		},
	};
}
