import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import type { AstroUserConfig } from '../../types/public/index.js';

export const ASTRO_CONFIG_DEFAULTS = {
	root: '.',
	srcDir: './src',
	publicDir: './public',
	outDir: './dist',
	cacheDir: './node_modules/.astro',
	base: '/',
	trailingSlash: 'ignore',
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
	image: {
		endpoint: { entrypoint: undefined, route: '/_image' },
		service: { entrypoint: 'astro/assets/services/sharp', config: {} },
	},
	devToolbar: {
		enabled: true,
	},
	compressHTML: true,
	server: {
		host: false,
		port: 4321,
		open: false,
	},
	integrations: [],
	markdown: markdownConfigDefaults,
	vite: {},
	legacy: {
		collections: false,
	},
	redirects: {},
	security: {
		checkOrigin: true,
	},
	env: {
		schema: {},
		validateSecrets: false,
	},
	experimental: {
		clientPrerender: false,
		contentIntellisense: false,
		responsiveImages: false,
		svg: false,
	},
} satisfies AstroUserConfig & { server: { open: boolean } };
