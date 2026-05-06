import { defineConfig } from 'astro/config';

export default defineConfig({
	build: {
		inlineStylesheets: 'never',
	},
	redirects: {
		'/docs-start': '/about/',
	},
	experimental: {
		incrementalBuild: true,
	},
});
