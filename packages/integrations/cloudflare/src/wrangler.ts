import { existsSync } from 'node:fs';
import type { PluginConfig } from '@cloudflare/vite-plugin';

/**
 * Checks whether a wrangler file exists at the given path
 * @param root
 */
export function hasWranglerConfig(root: URL) {
	return (
		existsSync(new URL('wrangler.jsonc', root)) ||
		existsSync(new URL('wrangler.toml', root)) ||
		existsSync(new URL('wrangler.json', root))
	);
}

/**
 * Returns the default wrangler configuration used by Astro Cloudflare configuration.
 */
export function defaultCloudflareConfig(): PluginConfig['config'] {
	return {
		// TODO: better way to handle name, maybe package.json#name ?
		name: 'test-application',
		compatibility_date: '2025-05-21',
		compatibility_flags: ['global_fetch_strictly_public'],
		main: '@astrojs/cloudflare/entrypoints/server',
		assets: {
			directory: './dist',
			binding: 'ASSETS',
		},
		images: {
			binding: 'IMAGES',
		},
		kv_namespaces: [
			{
				binding: 'SESSION',
				// KV with no binding gets automatically created
			},
		],
	};
}
