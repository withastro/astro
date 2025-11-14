import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginPrerender(
	_opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	return {
		name: 'astro:rollup-plugin-prerender',

		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},

		generateBundle() {
			const moduleIds = this.getModuleIds();
			for (const id of moduleIds) {
				const pageInfo = internals.pagesByViteID.get(id);
				if (!pageInfo) continue;
				const moduleInfo = this.getModuleInfo(id);
				if (!moduleInfo) continue;
				pageInfo.route.prerender = Boolean(moduleInfo?.meta?.astro?.pageOptions?.prerender);
			}
		},
	};
}
