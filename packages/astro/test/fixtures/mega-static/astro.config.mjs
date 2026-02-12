import preact from '@astrojs/preact';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		react({
			include: ['**/react/*', '**/RCounter.jsx', '**/Nested.jsx'],
		}),
		preact({
			include: ['**/preact/*', '**/PCounter.jsx'],
		}),
	],
	site: 'http://example.com',
	base: '/subpath',
	ssr: {
		noExternal: ['@test/static-build-pkg'],
	},
  redirects: {
    '/old': '/new',
  },
});
