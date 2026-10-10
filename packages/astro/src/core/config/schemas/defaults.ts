import { markdownConfigDefaults } from '@astrojs/internal-helpers/markdown';
import { ASTRO_PLUGIN_DEFAULTS } from '@astrojs/vite-plugin-astro/defaults';
import type { AstroUserConfig } from '../../../types/public/config.js';

export const ASTRO_CONFIG_DEFAULTS = {
	...ASTRO_PLUGIN_DEFAULTS,
	root: '.',
	outDir: './dist',
	cacheDir: './node_modules/.astro',
	base: '/',
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
		dangerouslyProcessSVG: false,
		responsiveStyles: false,
	},
	devToolbar: {
		enabled: true,
	},
	server: {
		host: false,
		port: 4321,
		open: false,
		allowedHosts: [],
	},
	integrations: [],
	markdown: markdownConfigDefaults,
	vite: {},
	legacy: {
		collectionsBackwardsCompat: false,
	},
	redirects: {},
	security: {
		checkOrigin: true,
		allowedDomains: [],
		csp: false,
		actionBodySizeLimit: 1024 * 1024,
		serverIslandBodySizeLimit: 1024 * 1024,
	},
	env: {
		schema: {},
		validateSecrets: false,
	},
	prerenderConflictBehavior: 'warn',
	fetchFile: 'fetch',
	experimental: {
		clientPrerender: false,
		contentIntellisense: false,
		chromeDevtoolsWorkspace: false,
		incrementalBuild: false,
		redirectPage: false,
		parallelPrerender: false,
		collectionStorage: 'single-file',
	},
} satisfies AstroUserConfig & {
	server: { open: boolean };
};
