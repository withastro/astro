import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { SessionStorageInitError } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizePath } from '../viteUtils.js';
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

// When no session driver will be present at request time, swap Astro's own
// `core/session/provider.js` for `core/session/provider-disabled.js` so
// Rollup tree-shakes `runtime.js` (and `unstorage`) out of the SSR bundle.
//
// This covers `session: false`, `session: undefined`, and a `session`
// object without a driver. By the time this plugin resolves, adapters have
// already wired their default driver into `config.session.driver` (during
// `astro:config:setup`), so `session?.driver` reflects the final decision —
// the same signal `vitePluginSessionDriver` uses to emit `default null`.
// Swapping in the no-op provider is behavior-preserving: the real provider
// already resolves `Astro.session` to `undefined` when no driver factory
// exists, so the only difference is the dead runtime is dropped.
//
// To avoid hijacking unrelated `./session/provider.js` paths in user code
// or third-party deps, we resolve each candidate specifier through Vite
// and only redirect when it resolves to Astro's own provider file.
const PROVIDER_FILENAME = 'provider.js';
const DISABLED_PROVIDER_FILENAME = 'provider-disabled.js';

function canonicalizePath(filePath: string): string {
	try {
		// Resolve symlinks, which Node does for `import.meta.url` but Vite only
		// does when `resolve.preserveSymlinks` is false, and normalize to forward
		// slashes so the two sides compare equal on Windows.
		return normalizePath(realpathSync(filePath));
	} catch {
		// Not a file on disk (bare specifier, virtual module), so there is no
		// symlink to resolve.
		return normalizePath(filePath);
	}
}

export function vitePluginSessionProvider({ settings }: { settings: AstroSettings }): VitePlugin {
	const providerPath = canonicalizePath(
		fileURLToPath(new URL(`./${PROVIDER_FILENAME}`, import.meta.url)),
	);
	const disabledProviderPath = canonicalizePath(
		fileURLToPath(new URL(`./${DISABLED_PROVIDER_FILENAME}`, import.meta.url)),
	);
	return {
		name: 'astro:session-provider',
		enforce: 'pre',
		async resolveId(id, importer) {
			// Keep the real provider only when a driver will be present.
			const session = settings.config.session;
			const hasSessionDriver = session !== false && !!session?.driver;
			if (hasSessionDriver) return null;
			// Cheap prefilter to avoid resolving every import in the graph.
			// Only specifiers that *could* point at Astro's provider file
			// proceed to the (expensive) full resolution + identity check.
			if (!normalizePath(id).endsWith(`/session/${PROVIDER_FILENAME}`)) return null;
			// Fast path: caller already passed Astro's absolute provider path.
			if (canonicalizePath(id) === providerPath) return disabledProviderPath;
			if (!importer) return null;
			const resolved = await this.resolve(id, importer, { skipSelf: true });
			if (resolved && canonicalizePath(resolved.id) === providerPath) {
				return disabledProviderPath;
			}
			return null;
		},
	};
}
