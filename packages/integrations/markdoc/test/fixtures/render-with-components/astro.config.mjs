import markdoc from '@astrojs/markdoc';
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	integrations: [markdoc(), preact()],
});
