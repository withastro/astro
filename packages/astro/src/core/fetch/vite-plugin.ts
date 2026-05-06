import { fileURLToPath } from 'node:url';
import {
	normalizePath as viteNormalizePath,
	type ViteDevServer,
	type Plugin as VitePlugin,
} from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';

/**
 * Virtual module that exposes the app's top-level fetch handler.
 *
 * If the user has a `src/app.ts` (or `.js` / `.mjs` / `.mts`) file that
 * default-exports a `{ fetch }` object, the virtual module re-exports it.
 * Otherwise it re-exports `defaultFetchHandler` from the built-in pipeline.
 *
 * Consumed by the generated app entrypoints (`prod.ts` / `dev.ts`) which
 * pass the resolved handler to `app.setFetchHandler(...)` after the `App`
 * is instantiated.
 */
const FETCHABLE_MODULE_ID = 'virtual:astro:fetchable';
const FETCHABLE_RESOLVED_MODULE_ID = '\0' + FETCHABLE_MODULE_ID;
// Segment under `srcDir` to probe for the user's handler module.
// Matches how `vitePluginMiddleware` resolves `src/middleware`.
const APP_PATH_SEGMENT_NAME = 'app';

export function vitePluginFetchable({ settings }: { settings: AstroSettings }): VitePlugin {
	let resolvedUserAppId: string | undefined;
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
		configureServer(server: ViteDevServer) {
			server.watcher.on('change', (path) => {
				const normalizedPath = viteNormalizePath(path);
				if (!normalizedPath.startsWith(normalizedSrcDir)) return;
				const relativePath = normalizedPath.slice(normalizedSrcDir.length);
				// Dot-prefix guard: match `app.ts` but not e.g. `app-utils.ts`.
				if (!relativePath.startsWith(`${APP_PATH_SEGMENT_NAME}.`)) return;

				for (const name of [
					ASTRO_VITE_ENVIRONMENT_NAMES.ssr,
					ASTRO_VITE_ENVIRONMENT_NAMES.astro,
				] as const) {
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
					// Re-export the user's default export (expected to be a
					// `{ fetch }` object, per the web Fetch API convention).
					return {
						code: `export { default } from '${resolvedUserAppId}';`,
					};
				}
				// No user-authored app — fall back to the built-in pipeline.
				return {
					code: `import { DefaultFetchHandler } from 'astro/app/fetch/default-handler';
export default new DefaultFetchHandler();`,
				};
			},
		},
	};
}
