import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { SessionStorageInitError } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizeSessionDriverConfig } from './utils.js';

export const VIRTUAL_SESSION_DRIVER_ID = 'virtual:astro:session-driver';
const RESOLVED_VIRTUAL_SESSION_DRIVER_ID = '\0' + VIRTUAL_SESSION_DRIVER_ID;

export function vitePluginSessionDriver({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: VIRTUAL_SESSION_DRIVER_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_SESSION_DRIVER_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_SESSION_DRIVER_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_SESSION_DRIVER_ID}$`),
			},
			async handler() {
				const session = settings.config.session;
				if (session === false || !session?.driver) {
					return { code: 'export default null;' };
				}

				const driver = normalizeSessionDriverConfig(session.driver, session.options);
				const importerPath = fileURLToPath(import.meta.url);
				const resolved = await this.resolve(driver.entrypoint, importerPath);
				if (!resolved) {
					throw new AstroError({
						...SessionStorageInitError,
						message: SessionStorageInitError.message(
							`Failed to resolve session driver: ${driver.entrypoint}`,
							driver.entrypoint,
						),
					});
				}

				return {
					code: `import { default as _default } from '${resolved.id}';\nexport * from '${resolved.id}';\nexport default _default;`,
				};
			},
		},
	};
}

// When `session: false`, swap Astro's own `core/session/provider.js` for
// `core/session/provider-disabled.js` so Rollup tree-shakes `runtime.js`
// out of the SSR bundle. In other modes the hook short-circuits and
// provider.js resolves normally (re-exporting from handler.js).
//
// To avoid hijacking unrelated `./session/provider.js` paths in user code
// or third-party deps, we resolve each candidate specifier through Vite
// and only redirect when it resolves to Astro's own provider file.
const PROVIDER_FILENAME = 'provider.js';
const DISABLED_PROVIDER_FILENAME = 'provider-disabled.js';

export function vitePluginSessionProvider({
	settings,
}: { settings: AstroSettings }): VitePlugin {
	const providerPath = fileURLToPath(new URL(`./${PROVIDER_FILENAME}`, import.meta.url));
	const disabledProviderPath = fileURLToPath(
		new URL(`./${DISABLED_PROVIDER_FILENAME}`, import.meta.url),
	);
	return {
		name: 'astro:session-provider',
		enforce: 'pre',
		async resolveId(id, importer) {
			if (settings.config.session !== false) return null;
			// Fast path: caller already passed Astro's absolute provider path.
			if (id === providerPath) return disabledProviderPath;
			// Cheap prefilter to avoid resolving every import in the graph.
			// Only specifiers that *could* point at Astro's provider file
			// proceed to the (expensive) full resolution + identity check.
			if (!importer || !id.endsWith(`/session/${PROVIDER_FILENAME}`)) return null;
			const resolved = await this.resolve(id, importer, { skipSelf: true });
			if (resolved && resolved.id === providerPath) {
				return disabledProviderPath;
			}
			return null;
		},
	};
}
