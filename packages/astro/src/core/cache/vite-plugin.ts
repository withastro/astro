import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { AstroError } from '../errors/errors.js';
import { CacheProviderNotFound } from '../errors/errors-data.js';
import { normalizeCacheProviderConfig } from './utils.js';

export const VIRTUAL_CACHE_PROVIDER_ID = 'virtual:astro:cache-provider';
const RESOLVED_VIRTUAL_CACHE_PROVIDER_ID = '\0' + VIRTUAL_CACHE_PROVIDER_ID;

export function vitePluginCacheProvider({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: VIRTUAL_CACHE_PROVIDER_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CACHE_PROVIDER_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CACHE_PROVIDER_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CACHE_PROVIDER_ID}$`),
			},
			async handler() {
				if (!settings.config.experimental?.cache?.provider) {
					return { code: 'export default null;' };
				}

				const provider = normalizeCacheProviderConfig(settings.config.experimental.cache.provider);
				// Use the project root as the importer so that adapter-provided
				// providers (e.g. @astrojs/node/cache) resolve from the project's
				// node_modules, not from astro core's location.
				const importerPath = fileURLToPath(new URL('package.json', settings.config.root));
				let resolved;
				try {
					resolved = await this.resolve(provider.entrypoint, importerPath);
				} catch {
					// Resolution can throw for invalid package specifiers
				}
				if (!resolved) {
					throw new AstroError({
						...CacheProviderNotFound,
						message: CacheProviderNotFound.message(provider.entrypoint),
					});
				}

				return {
					code: `import { default as _default } from '${resolved.id}';\nexport * from '${resolved.id}';\nexport default _default;`,
				};
			},
		},
	};
}
