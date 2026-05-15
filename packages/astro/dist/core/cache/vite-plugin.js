import { fileURLToPath } from 'node:url';
import { AstroError } from '../errors/errors.js';
import { CacheProviderNotFound } from '../errors/errors-data.js';
import { normalizeCacheProviderConfig } from './utils.js';
const VIRTUAL_CACHE_PROVIDER_ID = 'virtual:astro:cache-provider';
const RESOLVED_VIRTUAL_CACHE_PROVIDER_ID = '\0' + VIRTUAL_CACHE_PROVIDER_ID;
function vitePluginCacheProvider({ settings }) {
	const providerConfig = settings.config.experimental?.cache?.provider;
	if (!providerConfig) {
		return;
	}
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
				const provider = normalizeCacheProviderConfig(providerConfig);
				const importerPath = fileURLToPath(new URL('package.json', settings.config.root));
				let resolved;
				try {
					resolved = await this.resolve(provider.entrypoint, importerPath);
				} catch {}
				if (!resolved) {
					const displayName = provider.name ?? provider.entrypoint;
					throw new AstroError({
						...CacheProviderNotFound,
						message: CacheProviderNotFound.message(displayName),
					});
				}
				return {
					code: `import { default as _default } from '${resolved.id}';
export * from '${resolved.id}';
export default _default;`,
				};
			},
		},
	};
}
export { VIRTUAL_CACHE_PROVIDER_ID, vitePluginCacheProvider };
