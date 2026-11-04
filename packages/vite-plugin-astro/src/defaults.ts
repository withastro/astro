/**
 * Default values of the shared options owned by `astro()`. Kept free of imports so runtime code
 * (such as the Container API) can read them without loading the options schema.
 */
export const ASTRO_PLUGIN_DEFAULTS = {
	publicDir: './public',
	compressHTML: 'jsx',
	trailingSlash: 'ignore',
} as const;
