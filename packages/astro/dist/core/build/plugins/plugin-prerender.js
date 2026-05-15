import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
function pluginPrerender(_opts, internals) {
	return {
		name: 'astro:rollup-plugin-prerender',
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
export { pluginPrerender };
