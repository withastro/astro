import { vitePluginMiddlewareBuild } from '../../middleware/vite-plugin.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
function pluginMiddleware(opts, internals) {
	const plugin = vitePluginMiddlewareBuild(opts, internals);
	return {
		...plugin,
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
	};
}
export { pluginMiddleware };
