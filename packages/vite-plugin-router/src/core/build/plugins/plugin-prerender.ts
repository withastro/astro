import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../../../internal/core/build/internal.js';
import type { StaticBuildOptionsInput } from '../../../internal/core/build/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../../internal/core/constants.js';

export function pluginPrerender(
	_opts: StaticBuildOptionsInput,
	internals: BuildInternals,
): VitePlugin {
	return {
		name: 'astro:rolldown-plugin-prerender',

		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
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
