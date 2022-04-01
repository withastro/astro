import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	integrations: [preact()],
	site: 'http://example.com/subpath/',
	ssr: {
		noExternal: ['@test/static-build-pkg'],
	},
});
