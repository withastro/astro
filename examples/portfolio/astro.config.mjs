import { defineConfig } from 'astro/config';
import preact from '@astrojs/render-preact';

// https://astro.build/config
export default defineConfig({
	integrations: [preact()],
});
