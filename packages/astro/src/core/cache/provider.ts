import type { SSRManifest } from '../app/types.js';
import { createAsyncManifestMemo } from '../manifest/memo.js';
import type { CacheProvider, CacheProviderFactory } from './types.js';

const cacheProviderMemo = createAsyncManifestMemo<CacheProvider | null>(async (manifest) => {
	// Try to load the provider factory from the manifest and invoke it with the
	// configured options; `null` (not configured) is cached like any other value.
	if (manifest.cacheProvider) {
		const mod = await manifest.cacheProvider();
		const factory: CacheProviderFactory | null = mod?.default || null;
		return factory ? factory(manifest.cacheConfig?.options) : null;
	}
	return null;
});

/** Resolves the cache provider from the manifest, `null` when none. */
export function getCacheProvider(manifest: SSRManifest): Promise<CacheProvider | null> {
	return cacheProviderMemo.get(manifest);
}
