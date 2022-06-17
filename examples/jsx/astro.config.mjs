import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import jsx from '@astrojs/jsx';

// https://astro.build/config
export default defineConfig({
	integrations: [
		preact(),
		jsx()
	]
});
