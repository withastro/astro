import { existsSync } from 'node:fs';

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
 * Creates a minimal wrangler.json file
 */
export function wranglerTemplate(): string {
	const wrangler = {
		// TODO: better way to handle name, maybe package.json#name ?
		name: 'test-application',
		compatibility_date: '2024-11-01',
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
				id: 'SESSION',
			},
		],
	};

	return JSON.stringify(wrangler, null, 2);
}
