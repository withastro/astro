import type { Plugin as VitePlugin } from 'vite';
import { routeIsRedirect } from '../../redirects/index.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { ASTRO_PAGE_MODULE_ID } from './plugin-pages.js';
import { getVirtualModulePageName } from './util.js';

const PAGES_VIRTUAL_MODULE_ID = 'virtual:astro:pages';
export const RESOLVED_PAGES_VIRTUAL_MODULE_ID = '\0' + PAGES_VIRTUAL_MODULE_ID;

export function pluginPrerenderEntry(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-pages',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === 'ssr' || environment.name === 'prerender';
		},
		resolveId(id) {
			if (id === PAGES_VIRTUAL_MODULE_ID) {
				return RESOLVED_PAGES_VIRTUAL_MODULE_ID;
			}
		},
		async load(id) {
			if (id === RESOLVED_PAGES_VIRTUAL_MODULE_ID) {
				const { allPages } = options;
				const imports: string[] = [];
				const pageMap: string[] = [];
				let i = 0;

				for (const pageData of Object.values(allPages)) {
					if (routeIsRedirect(pageData.route)) {
						continue;
					}
					const virtualModuleName = getVirtualModulePageName(
						ASTRO_PAGE_MODULE_ID,
						pageData.component,
					);
					let module = await this.resolve(virtualModuleName);
					if (module) {
						const variable = `_page${i}`;
						// we need to use the non-resolved ID in order to resolve correctly the virtual module
						imports.push(`const ${variable} = () => import("${virtualModuleName}");`);

						const pageData2 = internals.pagesByKeys.get(pageData.key);
						// Always add to pageMap even if pageData2 is missing from internals
						// This ensures error pages like 500.astro are included in the build
						pageMap.push(
							`[${JSON.stringify(pageData2?.component || pageData.component)}, ${variable}]`,
						);
						i++;
					}
				}
				const pageMapCode = `const pageMap = new Map([\n    ${pageMap.join(',\n    ')}\n]);\n\nexport { pageMap };`;
				return { code: [...imports, pageMapCode].join('\n') };
			}
		},
	};
}
