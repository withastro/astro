import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { AstroError } from '../errors/index.js';
import { normalizeCacheDriverConfig } from './utils.js';

export const VIRTUAL_CACHE_DRIVER_ID = 'virtual:astro:cache-driver';
const RESOLVED_VIRTUAL_CACHE_DRIVER_ID = '\0' + VIRTUAL_CACHE_DRIVER_ID;

export function vitePluginCacheDriver({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: VIRTUAL_CACHE_DRIVER_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CACHE_DRIVER_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CACHE_DRIVER_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CACHE_DRIVER_ID}$`),
			},
			async handler() {
				if (!settings.config.experimental?.cache?.driver) {
					return { code: 'export default null;' };
				}

				const driver = normalizeCacheDriverConfig(settings.config.experimental.cache.driver);
				// Use the project root as the importer so that adapter-provided
				// drivers (e.g. @astrojs/node/cache) resolve from the project's
				// node_modules, not from astro core's location.
				const importerPath = fileURLToPath(new URL('package.json', settings.config.root));
				const resolved = await this.resolve(driver.entrypoint, importerPath);
				if (!resolved) {
					throw new AstroError({
						name: 'CacheDriverInitError',
						title: 'Failed to initialize cache driver',
						message: `Failed to resolve cache driver: ${driver.entrypoint}`,
					});
				}

				return {
					code: `import { default as _default } from '${resolved.id}';\nexport * from '${resolved.id}';\nexport default _default;`,
				};
			},
		},
	};
}
