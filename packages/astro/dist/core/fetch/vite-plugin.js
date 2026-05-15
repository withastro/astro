import { fileURLToPath } from 'node:url';
import { normalizePath as viteNormalizePath } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
const FETCHABLE_MODULE_ID = 'virtual:astro:fetchable';
const FETCHABLE_RESOLVED_MODULE_ID = '\0' + FETCHABLE_MODULE_ID;
const APP_PATH_SEGMENT_NAME = 'app';
function vitePluginFetchable({ settings }) {
	let resolvedUserAppId;
	let userAppPresent = false;
	const advancedRoutingEnabled = settings.config.experimental.advancedRouting;
	const normalizedSrcDir = viteNormalizePath(fileURLToPath(settings.config.srcDir));
	return {
		name: '@astro/plugin-fetchable',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configureServer(server) {
			server.watcher.on('change', (path) => {
				const normalizedPath = viteNormalizePath(path);
				if (!normalizedPath.startsWith(normalizedSrcDir)) return;
				const relativePath = normalizedPath.slice(normalizedSrcDir.length);
				if (!relativePath.startsWith(`${APP_PATH_SEGMENT_NAME}.`)) return;
				for (const name of [ASTRO_VITE_ENVIRONMENT_NAMES.ssr, ASTRO_VITE_ENVIRONMENT_NAMES.astro]) {
					const environment = server.environments[name];
					if (!environment) continue;
					const virtualMod = environment.moduleGraph.getModuleById(FETCHABLE_RESOLVED_MODULE_ID);
					if (virtualMod) {
						environment.moduleGraph.invalidateModule(virtualMod);
					}
				}
			});
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${FETCHABLE_MODULE_ID}$`),
			},
			async handler() {
				const resolved = await this.resolve(`${normalizedSrcDir}${APP_PATH_SEGMENT_NAME}`);
				userAppPresent = advancedRoutingEnabled && !!resolved;
				resolvedUserAppId = resolved?.id;
				return FETCHABLE_RESOLVED_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${FETCHABLE_RESOLVED_MODULE_ID}$`),
			},
			handler() {
				if (userAppPresent && resolvedUserAppId) {
					return {
						code: `export { default } from '${resolvedUserAppId}';`,
					};
				}
				return {
					code: `import { DefaultFetchHandler } from 'astro/app/fetch/default-handler';
export default new DefaultFetchHandler();`,
				};
			},
		},
	};
}
export { vitePluginFetchable };
