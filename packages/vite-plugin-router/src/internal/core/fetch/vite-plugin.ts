import { fileURLToPath } from 'node:url';
import {
	normalizePath as viteNormalizePath,
	type ViteDevServer,
	type Plugin as VitePlugin,
} from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import type { RouterRegistry } from '../../registry.js';

/**
 * Virtual module that exposes the app's top-level fetch handler.
 *
 * If the user has a `src/fetch.ts` (or `.js` / `.mjs` / `.mts`) file that
 * default-exports a `{ fetch }` object, the virtual module re-exports it.
 * Otherwise it re-exports `defaultFetchHandler` from the built-in pipeline.
 *
 * Consumed by the generated app entrypoints (`prod.ts` / `dev.ts`) which
 * pass the resolved handler to `app.setFetchHandler(...)` after the `App`
 * is instantiated.
 */
const FETCHABLE_MODULE_ID = 'virtual:astro:fetchable';
const FETCHABLE_RESOLVED_MODULE_ID = '\0' + FETCHABLE_MODULE_ID;
// Default segment under `srcDir` to probe for the user's handler module.
// Matches how `vitePluginMiddleware` resolves `src/middleware`.
const DEFAULT_FETCH_FILE = 'fetch';
// Imported by absolute path: projects that depend only on `astro` cannot resolve this package.
const DEFAULT_HANDLER_MODULE = viteNormalizePath(
	fileURLToPath(new URL('./default-handler.js', import.meta.url)),
);

export interface FetchablePluginOptions {
	routerRegistry: RouterRegistry;
	/**
	 * The module under `srcDir`, without extension, whose default export handles every request.
	 * `null` disables it.
	 *
	 * @default 'fetch'
	 */
	fetchFile?: string | null;
}

export function vitePluginFetchable({
	routerRegistry,
	fetchFile: fetchFileOption,
}: FetchablePluginOptions): VitePlugin {
	let resolvedUserAppId: string | undefined;
	let userAppPresent = false;
	const fetchFile = fetchFileOption ?? DEFAULT_FETCH_FILE;
	// When fetchFile is null the feature is explicitly disabled.
	const fetchFileDisabled = fetchFileOption === null;
	const getSrcDir = () => viteNormalizePath(fileURLToPath(routerRegistry.config.srcDir));

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
				const normalizedSrcDir = getSrcDir();
				if (!normalizedPath.startsWith(normalizedSrcDir)) return;
				const relativePath = normalizedPath.slice(normalizedSrcDir.length);
				// Dot-prefix guard: match `app.ts` but not e.g. `app-utils.ts`.
				if (!relativePath.startsWith(`${fetchFile}.`)) return;

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
				if (fetchFileDisabled) {
					userAppPresent = false;
					return FETCHABLE_RESOLVED_MODULE_ID;
				}
				const resolved = await this.resolve(`${getSrcDir()}${fetchFile}`);
				userAppPresent = !!resolved;
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
						code: `export { default } from ${JSON.stringify(resolvedUserAppId)};`,
					};
				}
				// No user-authored app — fall back to the built-in pipeline.
				// `isDefaultFetchHandler` lets the dev server's per-request
				// re-import recognize this fallback WITHOUT relying on
				// `instanceof`: in dev the module graph containing this virtual
				// module can be invalidated (any src change invalidates the
				// manifest module, whose importers include the default handler),
				// so a re-evaluation would otherwise produce a different class
				// identity than the facade's own DefaultFetchHandler.
				return {
					code: `import { DefaultFetchHandler } from ${JSON.stringify(DEFAULT_HANDLER_MODULE)};
export default new DefaultFetchHandler();
export const isDefaultFetchHandler = true;`,
				};
			},
		},
	};
}
