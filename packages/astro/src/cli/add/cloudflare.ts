// This matches @astrojs/cloudflare's default because workerd rejects dates newer than the
// maximum supported by its binary. https://github.com/withastro/astro/issues/17796
const CLOUDFLARE_COMPATIBILITY_DATE = '2026-04-15';

export function createCloudflareWranglerConfig(name: string): string {
	return `\
{
	"$schema": "./node_modules/wrangler/config-schema.json",
	"compatibility_date": ${JSON.stringify(CLOUDFLARE_COMPATIBILITY_DATE)},
	"compatibility_flags": ["global_fetch_strictly_public"],
	"name": ${JSON.stringify(name)},
	"main": "@astrojs/cloudflare/entrypoints/server",
	"assets": {
		"directory": "./dist",
		"binding": "ASSETS"
	},
	"observability": {
		"enabled": true
	}
}`;
}
