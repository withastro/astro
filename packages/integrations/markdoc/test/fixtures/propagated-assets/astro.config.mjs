import markdoc from '@astrojs/markdoc';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [markdoc()],
	legacy: {
		// Content layer backwards compatibility has a bug in header propagation
		legacyContentCollections: true,
	},
});
