/**
 * Default values of the options owned by `router()`. Kept free of imports so runtime code can read
 * them without loading the options schema.
 */
export const ROUTER_PLUGIN_DEFAULTS = {
	output: 'static',
	build: {
		format: 'directory',
		client: './client/',
		server: './server/',
		assets: '_astro',
		serverEntry: 'entry.mjs',
		redirects: true,
		inlineStylesheets: 'auto',
		concurrency: 1,
	},
	redirects: {},
	security: {
		checkOrigin: true,
		serverIslandBodySizeLimit: 1024 * 1024,
	},
} as const;
